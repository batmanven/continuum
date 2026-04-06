# Continuum - Personal Health Management System

Continuum is a comprehensive health management platform that helps users track their health journey, manage medical expenses, and generate AI-powered health insights. Built with modern web technologies, it provides a seamless experience for organizing personal health data.

## Features

### Health Memory
- **Natural Health Chat**: Talk about how you're feeling in a conversational interface
- **AI-Powered Organization**: Automatically categorizes symptoms, medications, mood, and sleep patterns
- **Timeline Tracking**: Build a chronological health timeline with all your entries
- **Smart Search**: Find specific health events and patterns quickly
- **Persistent Chat**: Your health conversations are saved and accessible across sessions

### Bill Management
- **Medical Bill Processing**: Upload and analyze medical bills with AI
- **OCR Support**: Extract text from image-based bills automatically
- **Structured Data**: Get organized breakdown of charges, services, and costs
- **Expense Tracking**: Monitor medical spending over time
- **Bill History**: Access and search all your medical bills

### Doctor Summaries
- **AI-Generated Reports**: Create doctor-ready health summaries
- **Pattern Analysis**: Identify health trends and recurring issues
- **Recommendations**: Get personalized health insights
- **Summary Management**: Save, favorite, and organize health reports
- **Export Ready**: Perfect for sharing with healthcare providers

### Real-Time Dashboard
- **Health Overview**: See your health statistics at a glance
- **Financial Tracking**: Monitor medical expenses and categories
- **Recent Activity**: Timeline of all health and financial events
- **Trend Analysis**: Visual representations of health patterns
- **Quick Actions**: Easy access to all major features

## Technology Stack

### Frontend
- **React 18**: Modern, component-based UI framework
- **TypeScript**: Type-safe development experience
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn UI**: Beautiful, accessible component library
- **Vite**: Fast development and build tool

### Backend & Database
- **Supabase**: Authentication, database, and storage
- **PostgreSQL**: Robust relational database
- **Row Level Security**: Secure data access policies
- **Real-time Subscriptions**: Live data updates

### AI & Processing
- **Google Gemini AI**: Advanced natural language processing
- **Tesseract.js**: Optical character recognition for images
- **Custom Health Models**: Specialized health data extraction

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/batmanven/continuum.git
   cd continuum
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   supabase db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Open Application**
   Navigate to `http://localhost:5173` in your browser

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_GOOGLE_AI_API_KEY` | Google AI API key for Gemini | Yes |

## Database Schema

### Health Entries
- User health logs with AI-structured data
- Supports symptoms, medications, mood, energy, sleep tracking
- Confidence scoring and processing status

### Medical Bills
- Bill processing and storage
- Structured financial data extraction
- File attachments and metadata

### Doctor Summaries
- AI-generated health reports
- Insights, recommendations, and trends
- Categorization and tagging system

## Architecture

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components
│   ├── app/            # Application-specific components
│   └── landing/        # Landing page components
├── pages/              # Route components
│   ├── app/            # Main application pages
│   └── auth/           # Authentication pages
├── services/           # Business logic and API calls
├── hooks/              # Custom React hooks
└── lib/                # Utilities and configurations
```

### Data Flow
1. **User Input** → Health chat or bill upload
2. **AI Processing** → Gemini AI analysis and structuring
3. **Database Storage** → Supabase with RLS policies
4. **UI Updates** → Real-time dashboard and timeline updates

## Key Features Explained

### Health Memory Chat
The conversational interface allows users to naturally describe their health:
- "I have a headache and took paracetamol"
- "Feeling tired today, didn't sleep well"
- "Visited Dr. Sharma for checkup yesterday"

The AI automatically:
- Categorizes the entry type (symptom, medication, appointment)
- Extracts key details (severity, dosage, timing)
- Adds to the health timeline
- Provides contextual responses

### Bill Processing
Upload medical bills (PDF, images) to get:
- Itemized charge breakdown
- Service categorization
- Hospital/clinic identification
- Total cost calculation
- Date and visit details

### Doctor Summaries
Generate comprehensive health reports including:
- Patient health overview
- Key insights and patterns
- Personalized recommendations
- Timeline of significant events
- Export-ready format

## Security & Privacy

### Data Protection
- **Row Level Security**: Users can only access their own data
- **Secure Authentication**: Supabase Auth with JWT tokens
- **API Key Protection**: Environment variable configuration
- **Input Validation**: Sanitization and validation of all user inputs

### Privacy Features
- **Local Storage**: Chat persistence in browser only
- **Data Minimization**: Only collect necessary health information
- **User Control**: Full data deletion and export capabilities
- **Compliance**: GDPR-ready data handling

## Contributing

We welcome contributions to improve Continuum. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed

## Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
- Configure production environment variables
- Set up Supabase production project
- Configure Google AI API for production use
- Set up domain and SSL certificates

### Hosting Options
- **Vercel**: Recommended for React applications
- **Netlify**: Alternative static hosting
- **AWS S3**: For static asset hosting
- **Custom**: Any static hosting provider

## Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Ask questions and share ideas
- **Email**: Contact the development team

### Common Issues

**AI Processing Errors**
- Check Google AI API key configuration
- Verify API quota and limits
- Ensure proper text formatting

**Database Connection**
- Verify Supabase credentials
- Check RLS policies
- Ensure migrations are applied

**Authentication Problems**
- Clear browser cache and cookies
- Verify email configuration in Supabase
- Check JWT token expiration

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Roadmap

### Upcoming Features
- **Mobile App**: Native iOS and Android applications
- **Wearables Integration**: Connect with fitness trackers and health devices
- **Appointment Scheduling**: Book and manage healthcare appointments
- **Medication Reminders**: Smart notifications for medication adherence
- **Family Health**: Manage health data for family members
- **Advanced Analytics**: Deeper health insights and predictions
- **Integration Hub**: Connect with other health platforms and services

### Technical Improvements
- **Performance Optimization**: Faster load times and smoother interactions
- **Offline Support**: Access health data without internet connection
- **Enhanced Security**: Additional privacy and security features
- **API Development**: Public API for third-party integrations

## Acknowledgments

- **Supabase**: Backend and authentication platform
- **Google AI**: Advanced language processing capabilities
- **Vercel**: Hosting and deployment platform
- **Open Source Community**: Contributors and maintainers

---

**Continuum** - Your personal health companion for a healthier life.

Built with care for better health management and insights.