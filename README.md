# CivicResponse - Civic Issue Reporting System

A comprehensive web application for reporting and managing civic issues with role-based access, geolocation tracking, SLA management, and automated escalation workflows.

## Features

### Core Functionality
- **Citizen Portal**: Report issues with photos, location, and descriptions
- **Geolocation Tracking**: OpenStreetMap integration for precise issue locations
- **Role-Based Access**: Separate dashboards for citizens, L1 officers, L2 officers, and admins
- **Real-time Status Updates**: Track issue progress from submission to resolution
- **Comment System**: Communication between citizens and officers

### Advanced Features
- **SLA Management**: Automatic deadline calculation based on priority
- **Automated Escalation**: System automatically escalates overdue issues
- **Activity Logging**: Complete audit trail of all issue changes
- **Row Level Security**: Secure data access with Supabase RLS policies
- **Notifications**: Alert system for approaching deadlines

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with email/password
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Maps**: OpenStreetMap
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Supabase project set up
- Environment variables configured

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables (already configured in v0):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Database connection strings

4. Run the SQL scripts in order:
   \`\`\`bash
   # These are located in the scripts folder
   001_create_tables.sql
   002_rls_policies.sql
   003_functions_triggers.sql
   \`\`\`

5. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## User Roles

### Citizen
- Report civic issues
- Track submitted issues
- Add comments and updates
- View resolution status

### L1 Officer
- Review new submissions
- Assign issues to themselves
- Delegate to L2 officers
- Update priorities and statuses

### L2 Officer
- Work on assigned field issues
- Update progress status
- Mark issues as resolved
- Communicate with reporters

### Admin
- Full system oversight
- Manage all users and issues
- Reassign issues
- Monitor SLA compliance
- Trigger automated escalations

## SLA System

### Priority Levels
- **Critical**: 24-hour deadline
- **High**: 48-hour deadline
- **Medium**: 5-day deadline
- **Low**: 7-day deadline

### Automated Workflows
- **Escalation API**: `/api/escalate-issues` - Auto-escalates overdue issues
- **Notification API**: `/api/send-notifications` - Sends alerts for urgent issues
- **SLA Check API**: `/api/check-sla` - Monitors SLA metrics

## Database Schema

### Main Tables
- `profiles`: User information and roles
- `issues`: Civic issue reports
- `issue_comments`: Comments and updates
- `activity_log`: Audit trail

### Enums
- `user_role`: citizen, l1_officer, l2_officer, admin
- `issue_status`: submitted, assigned_l1, assigned_l2, in_progress, resolved, closed, escalated
- `issue_priority`: low, medium, high, critical
- `issue_category`: pothole, streetlight, garbage, water_supply, sewage, traffic, park, other

## Security

- Row Level Security (RLS) enabled on all tables
- Authentication required for all routes except landing/auth pages
- Role-based access control enforced at database level
- Secure cookie handling for session management

## API Routes

- `POST /api/escalate-issues`: Escalate overdue issues
- `POST /api/send-notifications`: Send urgent notifications
- `GET /api/check-sla`: Get SLA metrics

## Future Enhancements

- Email notifications via SendGrid/Resend
- SMS alerts for critical issues
- Photo upload for issue documentation
- Analytics dashboard with charts
- Mobile app with React Native
- Multi-language support
- Export reports to PDF/CSV

## License

MIT License
