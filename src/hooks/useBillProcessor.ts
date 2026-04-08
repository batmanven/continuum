import { useState } from 'react';
import { billProcessor, BillData } from '@/services/billProcessor';
import { billService, BillRecord } from '@/services/billService';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useProfile } from '@/contexts/ProfileContext';
import { toast } from 'sonner';

export interface UseBillProcessorReturn {
  processBill: (rawText: string, file?: File) => Promise<void>;
  isProcessing: boolean;
  isExtractingText: boolean;
  result: BillRecord | null;
  error: string | null;
  clearResult: () => void;
  processingStage: 'idle' | 'extracting' | 'processing' | 'completed' | 'error';
}

export const useBillProcessor = (): UseBillProcessorReturn => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [result, setResult] = useState<BillRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<'idle' | 'extracting' | 'processing' | 'completed' | 'error'>('idle');

  const processBill = async (rawText: string, file?: File) => {
    if (!user) {
      toast.error('You must be logged in to process bills');
      return;
    }

    if (!rawText.trim() && !file) {
      toast.error('Please provide bill text or upload a file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProcessingStage('idle');

    try {
      
      let finalText = rawText;
      let fileUrl: string | undefined;
      let fileType: string | undefined;

      if (file) {
        try {
          setProcessingStage('extracting');
          setIsExtractingText(true);
          toast.loading('Extracting text from file...', { id: 'bill-processing' });
          
          finalText = await billProcessor.extractTextFromFile(file);
          const uploadResult = await billService.uploadBillFile(file);
          if (uploadResult.url) {
            fileUrl = uploadResult.url;
            fileType = file.type;
          }
          
          setIsExtractingText(false);
        } catch (fileError) {
          setIsExtractingText(false);
          toast.error('Failed to process file. Please try manual text input.', { id: 'bill-processing' });
          setError(fileError instanceof Error ? fileError.message : 'File processing failed');
          setProcessingStage('error');
          setIsProcessing(false);
          return;
        }
      }

      
      setProcessingStage('processing');
      toast.loading('Processing bill with AI...', { id: 'bill-processing' });
      
      const processingResult = await billProcessor.processBillText(finalText);
      
      if (!processingResult.success || !processingResult.data) {
        toast.error('Failed to process bill: ' + processingResult.error, { id: 'bill-processing' });
        setError(processingResult.error || 'Processing failed');
        setProcessingStage('error');
        setIsProcessing(false);
        return;
      }

      
      const dbResult = await billService.createBill(
        user.id,
        finalText,
        processingResult.data,
        fileUrl,
        fileType,
        activeProfile.id
      );

      if (dbResult.error) {
        toast.error('Failed to save bill: ' + dbResult.error, { id: 'bill-processing' });
        setError(dbResult.error);
        setProcessingStage('error');
        setIsProcessing(false);
        return;
      }

      
      if (dbResult.data) {
        setResult(dbResult.data);
        setProcessingStage('completed');
        toast.success('Bill processed successfully!', { id: 'bill-processing' });
      }
    } catch (error) {
      console.error('Bill processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unexpected error occurred';
      toast.error('Processing failed: ' + errorMessage, { id: 'bill-processing' });
      setError(errorMessage);
      setProcessingStage('error');
    } finally {
      setIsProcessing(false);
      setIsExtractingText(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return {
    processBill,
    isProcessing,
    isExtractingText,
    result,
    error,
    clearResult,
    processingStage
  };
};
