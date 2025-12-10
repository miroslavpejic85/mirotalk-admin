'use strict';

/**
 * Email Service
 * -------------
 * Handles sending email alerts for admin dashboard events.
 * Uses nodemailer to send emails via SMTP.
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const utils = require('../utils');
const Logs = utils.Logs;
const log = new Logs('EmailService');

let transporter = null;

const { EMAIL_ALERTS, EMAIL_FROM, EMAIL_SEND_TO, EMAIL_HOST, EMAIL_PORT, EMAIL_USERNAME, EMAIL_PASSWORD } = config;

/**
 * Initialize email transporter with SMTP configuration.
 */
function initializeTransporter() {
    if (!EMAIL_ALERTS) {
        log.debug('Email alerts are disabled');
        return null;
    }

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USERNAME || !EMAIL_PASSWORD) {
        log.warn('Email configuration incomplete. Email alerts will not be sent.');
        return null;
    }

    try {
        transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: parseInt(EMAIL_PORT),
            secure: parseInt(EMAIL_PORT) === 465, // true for 465, false for other ports
            auth: {
                user: EMAIL_USERNAME,
                pass: EMAIL_PASSWORD,
            },
        });

        log.info('Email transporter initialized', {
            host: EMAIL_HOST,
            port: EMAIL_PORT,
        });

        return transporter;
    } catch (error) {
        log.error('Failed to initialize email transporter', error.message);
        return null;
    }
}

/**
 * Get HTML email template for login alert.
 * @param {string} username
 * @param {string} ipAddress
 * @param {string} timestamp
 * @returns {string} HTML email content
 */
function getHtmlTemplate(username, ipAddress, timestamp) {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; background-color: #f5f5f5;">
		<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
				<h2 style="color: #333; margin-top: 0;">🔐 Admin Login Notification</h2>
				<p style="color: #666; font-size: 16px;">A successful login was detected on your MiroTalk Admin Dashboard.</p>
				
				<div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
						<table style="width: 100%; border-collapse: collapse;">
								<tr>
										<td style="padding: 8px 0; color: #555; font-weight: bold;">Username:</td>
										<td style="padding: 8px 0; color: #333;">${username}</td>
								</tr>
								<tr>
										<td style="padding: 8px 0; color: #555; font-weight: bold;">IP Address:</td>
										<td style="padding: 8px 0; color: #333;">${ipAddress}</td>
								</tr>
								<tr>
										<td style="padding: 8px 0; color: #555; font-weight: bold;">Timestamp:</td>
										<td style="padding: 8px 0; color: #333;">${timestamp}</td>
								</tr>
						</table>
				</div>

				<p style="color: #666; font-size: 14px; margin-top: 20px;">
						If this was not you, please secure your account immediately by changing your password.
				</p>
				
				<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
				
				<p style="color: #999; font-size: 12px; margin-bottom: 0;">
						This is an automated security alert from MiroTalk Admin Dashboard.
				</p>
		</div>
</div>
`;
}

/**
 * Get text email template for login alert.
 * @param {string} username
 * @param {string} ipAddress
 * @param {string} timestamp
 * @returns {string} Text email content
 */
function getTextTemplate(username, ipAddress, timestamp) {
    return `
MiroTalk Admin - Login Alert

A successful login was detected on your MiroTalk Admin Dashboard.

Username: ${username}
IP Address: ${ipAddress}
Timestamp: ${timestamp}

If this was not you, please secure your account immediately by changing your password.

This is an automated security alert from MiroTalk Admin Dashboard.
`;
}

/**
 * Send login alert email to administrator.
 *
 * @param {string} username - The username that logged in
 * @param {string} ipAddress - The IP address of the login
 * @returns {Promise<void>}
 */
async function sendLoginAlert(username, ipAddress) {
    if (!EMAIL_ALERTS) {
        return;
    }

    if (!transporter) {
        transporter = initializeTransporter();
        if (!transporter) {
            return;
        }
    }

    const timestamp = new Date().toISOString();
    const mailOptions = {
        from: EMAIL_FROM || EMAIL_USERNAME,
        to: EMAIL_SEND_TO,
        subject: '🔐 MiroTalk Admin - Login Alert',
        html: getHtmlTemplate(username, ipAddress, timestamp),
        text: getTextTemplate(username, ipAddress, timestamp),
    };

    try {
        await transporter.sendMail(mailOptions);
        log.info('Login alert email sent successfully', { username, ipAddress });
    } catch (error) {
        log.error('Failed to send login alert email', { error: error.message, username, ipAddress });
        throw error;
    }
}

module.exports = {
    sendLoginAlert,
};
