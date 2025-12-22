import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text, html }) => {
	// SMTP settings from env
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT || 587,
		secure: process.env.SMTP_SECURE === "true" || false,
		auth: {
			user: process.env.SMTP_MAIL,
			pass: process.env.SMTP_PASS,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_FROM || process.env.SMTP_MAIL,
		to,
		subject,
		text,
		html,
	};

	return transporter.sendMail(mailOptions);
};

export default sendEmail;
