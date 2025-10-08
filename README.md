# Digital Marketing CRM

A comprehensive Customer Relationship Management system for digital marketing agencies, featuring Facebook Marketing, Website Development, and Landing Page Design services.

## Features

### For Admin/Employee Users:
- **Dashboard Overview**: View total clients, total spend, and pending requests
- **Client Management**: 
  - Add/view client profiles with complete information
  - Track client balances
  - Send pre-filled WhatsApp messages to clients
  - Submit daily spending for Facebook Marketing campaigns
  - Track sales generated per dollar spent
- **Project Management**:
  - Manage running projects (Website Development, Landing Page Design, Facebook Marketing)
  - Store website credentials and access information
  - Assign projects to employees/developers
  - Track project status
- **Topup Request Management**: Approve or reject client balance topup requests

### For Client Users:
- **Personal Dashboard**: View balance, spending stats, and project status
- **Balance Management**: Request balance topups from admin
- **Spending History**: View detailed Facebook Marketing daily spends and sales data
- **Project Tracking**: Monitor assigned projects and their status
- **Profile Management**: View personal profile and contact information

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Template Engine**: EJS
- **Authentication**: Session-based with bcrypt password hashing
- **Styling**: Custom CSS with responsive design

## Installation

1. Clone the repository:
```bash
git clone https://github.com/shikhbeagami-beep/hello-my-digital-crm.git
cd hello-my-digital-crm
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

4. Access the application:
- Open your browser and navigate to `http://localhost:3000`

## Default Credentials

### Admin Login
- **Username**: admin
- **Password**: admin123

### Client Login
- Clients are created by the admin
- Default password for new clients: client123

## Database Structure

The system uses SQLite with the following main tables:
- **users**: Store all users (admin, employee, client)
- **clients**: Extended profile information for clients
- **daily_spends**: Track daily Facebook Marketing spending and sales
- **projects**: Manage running projects
- **topup_requests**: Handle balance topup requests

## Usage Guide

### Admin Workflow:

1. **Add New Client**:
   - Navigate to Clients → Add New Client
   - Fill in client details (name, email, phone, Facebook link, WhatsApp number)
   - Set initial balance if needed
   - Client can login with username and default password

2. **Submit Daily Spend**:
   - Go to client details page
   - Fill in the daily spend form with date, amount, sales count
   - Submit to automatically deduct from client balance

3. **Manage Projects**:
   - Navigate to Running Projects
   - Add new project with client selection
   - Assign to developers/employees
   - Store website credentials securely

4. **Process Topup Requests**:
   - View pending topup requests on dashboard or topups page
   - Approve to add balance to client account
   - Reject if request is not valid

5. **Send WhatsApp Messages**:
   - From client list, click "Send Message"
   - Pre-filled WhatsApp link will open in new tab

### Client Workflow:

1. **Check Dashboard**:
   - View current balance
   - See recent spending and sales data
   - Monitor project status

2. **Request Balance Topup**:
   - Click "Request Topup" button
   - Enter desired amount
   - Wait for admin approval

3. **View Spending History**:
   - Navigate to Spending History
   - See detailed daily spends
   - Track cost per sale metrics

## Services Offered

1. **Facebook Marketing**: 
   - Daily spend tracking
   - Sales generation monitoring
   - Cost per sale analysis

2. **Website Development**:
   - Project management
   - Credential storage
   - Developer assignment

3. **Landing Page Design**:
   - Project tracking
   - Status monitoring
   - Team collaboration

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- Role-based access control (Admin, Employee, Client)
- Secure credential storage

## Contributing

This is a private project for digital marketing agency use.

## License

ISC

## Support

For support or questions, contact the system administrator.
