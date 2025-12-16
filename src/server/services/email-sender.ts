import { Resend } from "resend";
import { getDecryptedApiKeys } from "~/server/services/settings";

async function getResendClient(): Promise<Resend> {
	const { resendApiKey } = await getDecryptedApiKeys();
	if (!resendApiKey) {
		throw new Error("Resend API key not configured");
	}
	return new Resend(resendApiKey);
}

async function getNotificationEmail(): Promise<string> {
	const { notificationEmail } = await getDecryptedApiKeys();
	if (!notificationEmail) {
		throw new Error("Notification email not configured");
	}
	return notificationEmail;
}

interface BreachAlertData {
	emailAddress: string;
	breaches: {
		name: string;
		title: string;
		domain: string;
		breachDate: string | null;
		dataClasses: string[];
		pwnCount: number | null;
	}[];
}

export async function sendBreachAlert(data: BreachAlertData): Promise<void> {
	const resend = await getResendClient();
	const notificationEmail = await getNotificationEmail();

	const breachList = data.breaches
		.map(
			(b) =>
				`<li>
          <strong>${b.title || b.name}</strong>
          ${b.domain ? `(${b.domain})` : ""}
          <br/>
          <small>
            ${b.breachDate ? `Breach date: ${b.breachDate}` : ""}
            ${b.pwnCount ? ` | ${b.pwnCount.toLocaleString()} accounts affected` : ""}
          </small>
          <br/>
          <small>Exposed data: ${b.dataClasses.join(", ")}</small>
        </li>`,
		)
		.join("");

	const html = `
    <h2>New Data Breach Alert</h2>
    <p>New breach(es) have been detected for: <strong>${data.emailAddress}</strong></p>
    <ul>${breachList}</ul>
    <hr/>
    <p><small>This alert was sent by Pwned Checker.</small></p>
  `;

	await resend.emails.send({
		from: "Pwned Checker <onboarding@resend.dev>",
		to: notificationEmail,
		subject: `Alert: ${data.breaches.length} new breach(es) detected for ${data.emailAddress}`,
		html,
	});
}

export async function sendScanSummary(
	emailsScanned: number,
	newBreaches: number,
	errors: string[],
): Promise<void> {
	const resend = await getResendClient();
	const notificationEmail = await getNotificationEmail();

	const html = `
    <h2>Scan Complete</h2>
    <p>Your scheduled breach scan has completed.</p>
    <ul>
      <li>Emails scanned: ${emailsScanned}</li>
      <li>New breaches found: ${newBreaches}</li>
      ${errors.length > 0 ? `<li>Errors: ${errors.length}</li>` : ""}
    </ul>
    ${errors.length > 0 ? `<h3>Errors</h3><pre>${errors.join("\n")}</pre>` : ""}
    <hr/>
    <p><small>This summary was sent by Pwned Checker.</small></p>
  `;

	await resend.emails.send({
		from: "Pwned Checker <onboarding@resend.dev>",
		to: notificationEmail,
		subject: `Scan Complete: ${newBreaches} new breach(es) found`,
		html,
	});
}
