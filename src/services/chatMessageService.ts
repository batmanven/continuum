import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id?: string;
  chat_id: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'document' | 'prescription' | 'lab_result';
  content?: string;
  attachments?: any[];
  is_read: boolean;
  read_at?: string;
  edited_at?: string;
  doctor_action?: string;
  created_at?: string;
  updated_at?: string;
}

export class ChatMessageService {
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    messageType: ChatMessage['message_type'] = 'text',
    attachments?: any[]
  ): Promise<{ data?: ChatMessage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          message_type: messageType,
          attachments: attachments || null,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      return { error: 'Failed to send message' };
    }
  }

  async getChatMessages(
    chatId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data?: ChatMessage[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching messages:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error fetching messages:', error);
      return { error: 'Failed to fetch messages' };
    }
  }

  async markAsRead(messageId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error marking message as read:', error);
      return { error: 'Failed to mark message as read' };
    }
  }

  async markChatAsRead(chatId: string, userId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking chat as read:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error marking chat as read:', error);
      return { error: 'Failed to mark chat as read' };
    }
  }

  async editMessage(
    messageId: string,
    newContent: string
  ): Promise<{ data?: ChatMessage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        console.error('Error editing message:', error);
        return { error: error.message };
      }

      return { data };
    } catch (error) {
      console.error('Unexpected error editing message:', error);
      return { error: 'Failed to edit message' };
    }
  }

  async getUnreadCount(chatId: string, userId: string): Promise<{ count: number; error?: string }> {
    try {
      const { data, error, count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .neq('sender_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread count:', error);
        return { count: 0, error: error.message };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Unexpected error getting unread count:', error);
      return { count: 0, error: 'Failed to get unread count' };
    }
  }

  async addDoctorAction(
    messageId: string,
    action: string
  ): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ doctor_action: action })
        .eq('id', messageId);

      if (error) {
        console.error('Error adding doctor action:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error adding doctor action:', error);
      return { error: 'Failed to add doctor action' };
    }
  }

  async deleteMessage(messageId: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Error deleting message:', error);
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Unexpected error deleting message:', error);
      return { error: 'Failed to delete message' };
    }
  }
}

export const chatMessageService = new ChatMessageService();
