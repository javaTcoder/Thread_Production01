import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, text, html }) => {
	// SMTP settings from env
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT || 587,
		secure: process.env.SMTP_SECURE === "true" || false,
		auth: {
			user: process.env.SMTP_MAIL,
			pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_FROM || process.env.SMTP_MAIL,
		to,
		subject,
		text,
		html,
	};

	try {
		// Verify connection configuration (helps surface auth/connectivity errors quickly)
		await transporter.verify();
	} catch (err) {
		console.error("SMTP connection/credentials verification failed:", err && err.message ? err.message : err);
		throw new Error("SMTP verification failed: " + (err && err.message ? err.message : "unknown error"));
	}

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log("Email sent:", info && info.messageId ? info.messageId : info);
		return info;
	} catch (err) {
		console.error("Error sending email:", err && err.message ? err.message : err);
		throw err;
	}
};

export default sendEmail;
