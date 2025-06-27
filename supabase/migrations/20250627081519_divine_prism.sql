/*
  # Email Template Customization for LizExpress

  1. Email Templates
    - Customize Supabase email templates for LizExpress branding
    - Set up proper redirect URLs for production domain

  2. Configuration
    - Update site URL and redirect URLs
    - Configure email settings for lizexpressltd.com
*/

-- This migration file documents the email configuration that needs to be done in Supabase Dashboard
-- The actual email template customization must be done through the Supabase Dashboard UI

-- Email templates to customize in Supabase Dashboard:
-- 1. Confirm signup template
-- 2. Reset password template  
-- 3. Magic link template
-- 4. Email change template

-- Site URL should be set to: https://lizexpressltd.com
-- Redirect URLs should include: https://lizexpressltd.com/email-confirmation

-- Email template variables available:
-- {{ .SiteURL }} - Your site URL
-- {{ .ConfirmationURL }} - Email confirmation URL
-- {{ .Email }} - User's email
-- {{ .Token }} - Confirmation token
-- {{ .TokenHash }} - Hashed token
-- {{ .RedirectTo }} - Redirect URL after confirmation

-- Example custom email template for signup confirmation:
/*
Subject: Welcome to LizExpress - Confirm Your Email

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to LizExpress</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4A0E67; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; background: #F7941D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to LizExpress!</h1>
            <p>Swap what you have for what you need</p>
        </div>
        <div class="content">
            <h2>Confirm Your Email Address</h2>
            <p>Hi there!</p>
            <p>Thank you for signing up for LizExpress. To complete your registration and start swapping items, please confirm your email address by clicking the button below:</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">{{ .ConfirmationURL }}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with LizExpress, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2025 LizExpress Ltd. All rights reserved.</p>
            <p>Visit us at <a href="https://lizexpressltd.com">lizexpressltd.com</a></p>
        </div>
    </div>
</body>
</html>
*/

-- Note: The actual email template customization must be done in the Supabase Dashboard
-- under Authentication > Email Templates