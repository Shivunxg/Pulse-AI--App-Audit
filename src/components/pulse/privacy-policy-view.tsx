'use client';

import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HeartPulse, Shield, Mail, Globe } from 'lucide-react';

export function PrivacyPolicyView() {
  const { navigate } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-14">
          <button onClick={() => navigate('landing')} className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <HeartPulse className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight">Pulse AI</span>
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <span className="text-muted-foreground">Privacy Policy</span>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-sm" onClick={() => navigate('landing')}>
              Home
            </Button>
            <Button size="sm" className="text-sm" onClick={() => navigate('landing')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* BACK LINK */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-8">
          <button
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pulse AI
          </button>
        </div>

        {/* HEADER BLOCK */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-12">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Legal
            </Badge>
            <span className="text-sm text-muted-foreground">Last updated: June 30, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.2]">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            This Privacy Policy describes how Pulse AI (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, stores, and shares your information when you use our website audit tool, Android APK scanner, and related services. We are committed to protecting your privacy and handling your data responsibly in compliance with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act, 2023 (DPDP Act) of India.
          </p>
        </div>

        {/* CONTENT */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16 space-y-10 text-sm leading-relaxed text-muted-foreground">

          {/* 1. Introduction */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Introduction</h2>
            <p className="mb-4">
              Pulse AI provides an AI-powered product intelligence platform that enables users to audit websites for performance, SEO, accessibility, security, and user experience, and to scan Android APK files for security vulnerabilities, permission issues, tracker detection, and code quality. Our services are designed to help developers, freelancers, agencies, and product teams build better products by providing actionable audit reports and AI-generated summaries based on deterministic analysis of publicly accessible web pages and uploaded application files.
            </p>
            <p className="mb-4">
              This Privacy Policy applies to all users of our service, including those accessing our website at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">pulseai.vercel.app</code> and all subdomains, our API endpoints, and our client-side application. By using Pulse AI, you acknowledge that you have read, understood, and agree to the practices described in this policy. We recommend that you read this policy carefully and check back periodically for updates, as our practices may change over time as our service evolves and as applicable data protection regulations are updated.
            </p>
            <p>
              Our privacy practices are governed by two primary regulatory frameworks depending on your jurisdiction. For users within the European Economic Area (EEA), the United Kingdom, and other jurisdictions where the GDPR applies, we process your personal data in accordance with the GDPR. For users in India and other jurisdictions where the Digital Personal Data Protection Act, 2023 (DPDP Act) applies, we comply with the requirements of that legislation. Regardless of your jurisdiction, we apply the highest standard of data protection available to all users, ensuring that your privacy is respected and your data is handled with the care and security it deserves.
            </p>
          </section>

          {/* 2. Data Controller */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Data Controller</h2>
            <p className="mb-4">
              For the purposes of this Privacy Policy and applicable data protection legislation, Pulse AI acts as the data controller of your personal information. As the data controller, we are responsible for deciding how and why your personal data is processed, and we are accountable for ensuring that our data processing activities comply with all relevant laws and regulations. We take this responsibility seriously and have implemented technical and organizational measures to safeguard your data throughout its lifecycle with us.
            </p>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding your personal data, our data processing practices, or your rights under applicable data protection law, please contact us using the information provided below. We aim to respond to all data-related inquiries within 30 days of receipt, and within 72 hours for urgent data breach notifications as required by law.
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">Privacy &amp; Data Protection</p>
                  <p className="text-xs">privacy@pulseai.app</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">General Support</p>
                  <p className="text-xs">support@pulseai.app</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">Website</p>
                  <p className="text-xs">pulseai.vercel.app</p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Data We Collect */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Data We Collect</h2>

            <h3 className="text-sm font-bold text-foreground mb-2">3.1 Data You Provide Directly</h3>
            <p className="mb-4">
              When you create an account with Pulse AI, we collect the personal information you provide during registration, which includes your email address, display name (optional), and authentication credentials managed through Google OAuth or our direct email-based authentication system. We also collect the URLs of websites you submit for auditing, Android APK files you upload for security scanning, and any project names or descriptions you assign to your audits within the dashboard. Additionally, we collect any communications you send to us, such as support tickets, feedback messages, and email correspondence, which may contain personal information relevant to your inquiry or request.
            </p>

            <h3 className="text-sm font-bold text-foreground mb-2">3.2 Data Collected Automatically</h3>
            <p className="mb-4">
              When you use our service, we automatically collect certain information about your usage patterns and interactions. This includes metadata about your audit requests, such as the timestamp, audit type (simple or deep), and the category breakdown of results. We also collect standard server log data including your IP address, user agent string, browser type and version, operating system, referring URL, and the pages or API endpoints you access. We use JWT (JSON Web Token) for session management, which contains a hashed user identifier and an expiration timestamp — this token is generated using the scrypt key derivation function and does not store any plaintext personal information. Additionally, we collect audit metadata such as performance scores, security header findings, and AI-generated summaries that are associated with your account and stored for your future reference.
            </p>

            <h3 className="text-sm font-bold text-foreground mb-2">3.3 Data We Do NOT Collect</h3>
            <p className="mb-4">
              We believe in transparency about data collection, and it is equally important to be clear about what we do <strong>not</strong> collect. Pulse AI does <strong>not</strong> store the raw HTML content of any website you audit. We analyze the page content in transit to extract audit findings, but the full HTML is not persisted to our database or any other storage medium. We do <strong>not</strong> use your audit data, website content, or APK files to train AI models. The AI summaries we generate are produced on-demand from the deterministic audit findings of your specific audit and are not used to fine-tune or train any machine learning model. We do <strong>not</strong> collect, process, or store payment card data — all payment processing is handled directly by Stripe through secure tokenization on their infrastructure. We do <strong>not</strong> engage in cross-site tracking, advertising profiling, or browser fingerprinting. We do not use third-party analytics or advertising cookies, and we have no integration with any advertising network or data broker.
            </p>
          </section>

          {/* 4. Legal Basis */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Legal Basis for Processing (GDPR Article 6)</h2>
            <p className="mb-4">
              Under the General Data Protection Regulation, we must have a lawful basis for processing your personal data. We rely on the following legal bases depending on the nature and context of the processing activity. Where we process your data for the purpose of fulfilling our contract with you — specifically, providing the website audit and APK scanning services you have signed up for — we rely on the lawful basis of <strong>contract performance</strong> as defined in Article 6(1)(b) of the GDPR. This covers the processing of your account information, audit inputs, and results that are necessary to deliver the service you requested.
            </p>
            <p className="mb-4">
              Where we process your data for purposes that are in our legitimate business interests — such as maintaining the security and integrity of our platform, improving our service based on aggregated usage patterns, and preventing fraud or abuse — we rely on <strong>legitimate interests</strong> under Article 6(1)(f) of the GDPR. We always conduct a balancing test to ensure that our legitimate interests do not override your fundamental rights and freedoms, and we document our assessment for each category of processing that relies on this basis.
            </p>
            <p className="mb-4">
              Where we process your data based on your explicit consent — such as when you opt in to receive marketing communications or agree to enhanced data processing for specific features — we rely on <strong>consent</strong> under Article 6(1)(a) of the GDPR. Consent is freely given, specific, informed, and unambiguous, and you may withdraw it at any time using the mechanisms described in Section 9 of this policy. Where we are legally obligated to process your data — for example, to comply with a court order, regulatory investigation, or applicable tax law — we rely on <strong>legal obligation</strong> under Article 6(1)(c) of the GDPR.
            </p>
            <p>
              For users in India, our processing of personal data is also governed by the grounds specified in the DPDP Act, 2023, including consent, legitimate uses as defined under the Act, and compliance with applicable laws. The DPDP Act provides a separate but complementary framework that we comply with alongside the GDPR for all applicable data subjects.
            </p>
          </section>

          {/* 5. How We Use */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. How We Use Your Data</h2>
            <p className="mb-4">
              We use the data we collect for the following specific purposes, each of which is tied to a lawful basis as described in the preceding section. These purposes are reviewed regularly to ensure they remain necessary, proportionate, and aligned with your reasonable expectations as a user of our service.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>Service Delivery:</strong> We use your account information, submitted URLs, and uploaded APK files to provide the website audit and APK scanning services you have requested. This includes running the audit engine, generating health scores, producing AI-written summaries, and storing the results in your dashboard for future access and comparison.
              </li>
              <li>
                <strong>Account Management:</strong> We use your email address and authentication credentials to manage your account, authenticate your sessions, process password changes, and communicate important account-related information such as security alerts, password resets, and subscription status updates.
              </li>
              <li>
                <strong>Security and Fraud Prevention:</strong> We use your IP address, user agent information, and JWT token metadata to detect and prevent unauthorized access, brute-force attacks, credential stuffing, and other security threats. We also use this data to enforce rate limits and prevent abuse of our audit infrastructure.
              </li>
              <li>
                <strong>Service Improvement:</strong> We use aggregated, anonymized usage data — such as the total number of audits run, average health scores across categories, and common security header configurations — to identify trends, improve our audit engine algorithms, and prioritize feature development. This data is aggregated at the population level and cannot be traced back to any individual user.
              </li>
              <li>
                <strong>Communication:</strong> We use your email address to send transactional communications related to your account and service, including audit completion notifications, subscription receipts, and security alerts. With your explicit consent, we may also send product updates, feature announcements, and marketing communications.
              </li>
              <li>
                <strong>Legal Compliance:</strong> We may use your data to comply with applicable laws, regulations, legal processes, or enforceable governmental requests. This includes responding to subpoenas, court orders, and regulatory inquiries from data protection authorities.
              </li>
            </ul>
            <p>
              We do not use your personal data for any purpose other than those described above, and we do not sell, rent, or trade your personal data to any third party for their own marketing or commercial purposes. If we determine that a new purpose for processing is necessary, we will update this Privacy Policy and, where required by law, seek your consent before commencing the new processing activity.
            </p>
          </section>

          {/* 6. Data Sharing */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. Data Sharing</h2>
            <p className="mb-4">
              Pulse AI does not sell your personal data to third parties. We share your data only in the specific circumstances described below, and only to the extent necessary to fulfill the stated purpose. Each third-party recipient is contractually or legally obligated to protect your data and is prohibited from using it for any purpose other than the one for which it was shared.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>Firebase (Google):</strong> We use Firebase Authentication to support Google OAuth sign-in and email-based authentication. Firebase processes your email address and authentication tokens solely for the purpose of verifying your identity and managing your session. Firebase operates under Google's privacy infrastructure and is certified under SOC 2 and ISO 27001.
              </li>
              <li>
                <strong>Supabase:</strong> We use Supabase as our database and API backend for storing account information, audit results, and project metadata. Supabase processes this data on our behalf as a data processor under a Data Processing Agreement (DPA) and does not access or use your data for any purpose other than providing the database services we have engaged them to deliver.
              </li>
              <li>
                <strong>AI Provider:</strong> We transmit audit findings (scores, issues, and metadata — not raw HTML or personal data) to an AI language model API to generate the executive summaries and action plans that accompany each audit. The AI provider processes this data under its own terms of service and privacy policy, and the data is not used to train the model beyond the standard API usage terms.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may share your data with law enforcement agencies, regulatory authorities, or other parties if we are legally compelled to do so by a valid legal process such as a subpoena, court order, or regulatory inquiry. We will notify you of such requests unless we are legally prohibited from doing so, except in cases where we believe disclosure is necessary to prevent imminent harm.
              </li>
            </ul>
            <p>
              We do not share your data with any advertising networks, data brokers, social media platforms, or any third party for marketing purposes. We conduct periodic reviews of all third-party data sharing arrangements to ensure that each recipient continues to meet our security and privacy standards.
            </p>
          </section>

          {/* 7. International Transfers */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. International Data Transfers (GDPR Articles 44-49)</h2>
            <p className="mb-4">
              As a globally accessible web service, Pulse AI may transfer your personal data outside the European Economic Area (EEA) to countries that do not have an adequacy decision from the European Commission. These transfers are necessary for the operation of our cloud infrastructure, which is hosted on platforms with global data center networks. When such transfers occur, we ensure that appropriate safeguards are in place to protect your data in accordance with GDPR Articles 44-49.
            </p>
            <p className="mb-4">
              For transfers to recipients in countries without an adequacy decision, we rely on Standard Contractual Clauses (SCCs) adopted by the European Commission as the primary transfer mechanism. Our contracts with each data processor include the approved SCCs, supplemented by additional technical and organizational measures as described in the Annexes to the clauses. We have conducted a Transfer Impact Assessment for each destination country and, where necessary, implemented supplementary measures such as end-to-end encryption of data in transit to address any risks identified in the assessment.
            </p>
            <p className="mb-4">
              For users in India, any transfer of personal data outside of India is governed by the rules specified under the Digital Personal Data Protection Act, 2023. We comply with all applicable requirements for international transfers under the DPDP Act, including any restrictions on transfers to countries designated by the Indian government. Where required, we maintain Data Processing Agreements that specify the terms of international data transfer and the safeguards implemented to protect the data.
            </p>
            <p>
              Our infrastructure providers are SOC 2 Type II certified and ISO 27001 compliant, providing additional assurance that your data is protected to the highest international standards regardless of where it is physically stored. We continuously monitor the regulatory landscape for changes to international data transfer requirements and update our safeguards accordingly.
            </p>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Data Retention</h2>
            <p className="mb-4">
              We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, as described in this Privacy Policy, or as required by applicable law. We have defined specific retention periods for each category of data, and these periods are reviewed annually to ensure they remain appropriate and compliant with evolving regulatory requirements.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>Account Data:</strong> Your account information, including your email address, display name, and subscription status, is retained for the duration of your active account. If you delete your account, this data is permanently erased from our primary database within 30 days of the deletion request, and from any backups within 90 days, except where retention is required by law (for example, to comply with tax record-keeping obligations).
              </li>
              <li>
                <strong>Audit Results:</strong> The results of your audits, including health scores, findings, and AI-generated summaries, are retained for the duration of your active account. If you delete your account, all associated audit results are permanently erased within 30 days. You can also delete individual audit results from your dashboard at any time without deleting your entire account.
              </li>
              <li>
                <strong>Server Logs:</strong> Server access logs, which contain IP addresses and user agent strings, are retained for 90 days for security monitoring, incident investigation, and debugging purposes. After 90 days, these logs are automatically and permanently deleted.
              </li>
              <li>
                <strong>Uploaded APK Files:</strong> Android APK files uploaded for security scanning are processed in real-time and are <strong>not</strong> stored on our servers after the audit is complete. The file is analyzed during the audit execution, the findings are extracted and stored, and the original APK file is immediately deleted from temporary storage. We do not maintain an archive of uploaded APK files.
              </li>
            </ul>
            <p>
              When data reaches the end of its retention period, it is securely and permanently deleted using cryptographic erasure methods that render the data unrecoverable. We do not retain any data in identifiable form beyond the stated retention periods unless we are legally required to do so, in which case we will restrict the processing to only what is required by the specific legal obligation.
            </p>
          </section>

          {/* 9. Your Rights */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Your Rights</h2>
            <p className="mb-4">
              Under applicable data protection law, you have specific rights regarding your personal data. We are committed to facilitating the exercise of these rights and will respond to all valid requests within 30 days of receipt, unless an extension is permitted by law. In certain circumstances, we may not be able to fulfill your request — for example, if the request is manifestly unfounded, excessive, or would adversely affect the rights and freedoms of others — in which case we will explain our reasoning.
            </p>
            <p className="mb-4">
              Under the GDPR (Articles 15-21), you have the following rights: <strong>Right of Access</strong> (Article 15) — you may request a copy of the personal data we hold about you, along with information about how and why it is processed; <strong>Right to Rectification</strong> (Article 16) — you may request correction of inaccurate or incomplete personal data; <strong>Right to Erasure</strong> (Article 17) — you may request deletion of your personal data in circumstances where it is no longer necessary, where consent has been withdrawn, or where processing is unlawful; <strong>Right to Restriction</strong> (Article 18) — you may request that we limit the processing of your data while a dispute is being resolved; <strong>Right to Data Portability</strong> (Article 20) — you may request a copy of your data in a structured, machine-readable format; <strong>Right to Object</strong> (Article 21) — you may object to processing based on legitimate interests; <strong>Right to Withdraw Consent</strong> — you may withdraw any consent you have given at any time, without affecting the lawfulness of processing before withdrawal; and <strong>Right to Lodge a Complaint</strong> — you have the right to lodge a complaint with a supervisory authority in your jurisdiction if you believe our processing of your data violates the GDPR.
            </p>
            <p className="mb-4">
              Under the DPDP Act, 2023, you have the following rights: <strong>Right to Access</strong> (Section 8(1)) — you may request a summary of your personal data and the processing activities we undertake; <strong>Right to Correction</strong> (Section 8(2)) — you may request correction of inaccurate or misleading personal data; <strong>Right to Erasure</strong> (Section 8(3)) — you may request deletion of your personal data where retention is no longer necessary for the purposes specified in this policy; <strong>Right to Grievance Redressal</strong> (Section 24) — you may file a grievance with us regarding any aspect of our data processing, and we are committed to resolving it within 30 days; and <strong>Right to Nomination</strong> (Section 9) — in the event of your death or incapacity, you may nominate another individual to exercise your rights on your behalf.
            </p>
            <p>
              To exercise any of these rights, please contact us at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">privacy@pulseai.app</code>. We will verify your identity before processing your request and will respond within the statutory timeframes. You may also exercise your right to account deletion directly through the settings page in your Pulse AI dashboard.
            </p>
          </section>

          {/* 10. Data Security */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Data Security</h2>
            <p className="mb-4">
              We implement industry-standard technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. All data transmitted between your browser and our servers is encrypted in transit using TLS 1.3 (Transport Layer Security), ensuring that your data cannot be intercepted or read by third parties during transmission. Our authentication system uses the scrypt key derivation function for password hashing, which is designed to be computationally expensive and resistant to brute-force attacks, and all sessions are managed through JWT tokens with configurable expiration times.
            </p>
            <p className="mb-4">
              Our infrastructure is hosted on platforms that maintain SOC 2 Type II certification and ISO 27001 compliance, providing independent third-party assurance that our hosting environment meets rigorous security standards. We implement role-based access controls (RBAC) within our organization to ensure that only authorized personnel can access personal data, and all access is logged and audited regularly. We conduct periodic security reviews and penetration testing of our application and infrastructure to identify and remediate vulnerabilities before they can be exploited.
            </p>
            <p>
              As described in Section 3.3, we do <strong>not</strong> persistently store the raw HTML content of websites you audit or the APK files you upload. This architectural decision significantly reduces our data exposure surface, as the only data we store are the audit results (scores, findings, and summaries) rather than the full source content. In the event of a data breach, the exposed data would be limited to account information and audit metadata, not the full content of any website or application you submitted for analysis.
            </p>
          </section>

          {/* 11. Cookies */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Cookies and Local Storage</h2>
            <p className="mb-4">
              Pulse AI uses only strictly necessary cookies and local storage entries that are essential for the operation of our service. Specifically, we use the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">pulse-auth</code> entry in localStorage to store your JWT authentication token, which is required to maintain your logged-in session across page refreshes. This token is generated when you sign in and is automatically cleared when you sign out or when the token expires. We do not use any analytics cookies, advertising cookies, tracking cookies, or social media cookies.
            </p>
            <p className="mb-4">
              We do not use Google Analytics, Facebook Pixel, Hotjar, Mixpanel, or any other third-party analytics or tracking service. We do not participate in cross-site tracking, browser fingerprinting, or device fingerprinting. There are no retargeting advertisements served on our platform, and we do not share any tracking data with advertising networks. The only third-party scripts loaded on our pages are those strictly required for service functionality: our authentication provider (Firebase) and our UI framework dependencies.
            </p>
            <p>
              Because we use only essential local storage entries and no cookies, you do not need to manage cookie consent banners or configure cookie preferences on our platform. If you clear your browser's localStorage, you will be signed out of Pulse AI and will need to authenticate again to access your account. This is the only consequence of clearing our local storage data.
            </p>
          </section>

          {/* 12. Children's Privacy */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Pulse AI is not directed at children under the age of 16 under the GDPR, or under the age of 18 under the DPDP Act, and we do not knowingly collect personal data from individuals in these age groups. Our service is designed for use by software developers, web professionals, security researchers, and product teams — audiences that are expected to be adults or legally emancipated minors. We do not employ design features, content, or marketing practices that are specifically targeted at children.
            </p>
            <p className="mb-4">
              If we become aware that we have inadvertently collected personal data from a child under the applicable age threshold, we will take immediate steps to delete that data from our systems as quickly as possible and within 72 hours of notification. If you are a parent, guardian, or authorized representative and believe that a child under the applicable age has provided personal data to us, please contact us at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">privacy@pulseai.app</code> with sufficient information for us to identify and locate the data in question, and we will take appropriate action.
            </p>
            <p>
              We do not provide specific tools or features for parental controls within our platform, as our service is not intended for use by children. We rely on the account creation process — which requires a valid email address and authentication — as a reasonable age gate, and we reserve the right to terminate any account that we determine, in good faith, to be operated by a person under the applicable age threshold.
            </p>
          </section>

          {/* 13. Data Breach */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">13. Data Breach Notification</h2>
            <p className="mb-4">
              In the event of a personal data breach that poses a risk to your rights and freedoms, we will notify you directly via email within 72 hours of becoming aware of the breach, in accordance with Article 33 of the GDPR. The notification will include the nature of the breach, the categories of data affected, the approximate number of data subjects impacted, the likely consequences of the breach, and the measures we have taken or plan to take to address the breach and mitigate its effects.
            </p>
            <p className="mb-4">
              We will also notify the relevant supervisory authority within the same 72-hour timeframe, as required by the GDPR and any other applicable data protection law. Our incident response plan defines specific roles, escalation procedures, communication templates, and technical response steps that are activated immediately upon detection of a potential breach. We conduct regular tabletop exercises and simulated breach scenarios to ensure our team is prepared to execute the incident response plan effectively under pressure.
            </p>
            <p>
              For users in India, we will comply with the breach notification requirements of the DPDP Act and any rules or regulations issued thereunder by the Data Protection Board of India. We maintain a comprehensive incident log that records all data security incidents, regardless of their severity, and use this log to continuously improve our security posture and prevent future incidents.
            </p>
          </section>

          {/* 14. DPIA */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">14. Data Protection Impact Assessment (DPIA)</h2>
            <p className="mb-4">
              Under Article 35 of the GDPR, we are required to conduct a Data Protection Impact Assessment (DPIA) for processing operations that are likely to result in a high risk to the rights and freedoms of natural persons. We have conducted and documented a DPIA for our core processing activities, including the collection and storage of authentication data, the processing of audit inputs and results, and the use of AI-generated summaries. The DPIA evaluated the necessity and proportionality of our processing, identified and assessed risks to data subjects, and documented the measures we have implemented to mitigate those risks.
            </p>
            <p className="mb-4">
              The DPIA concluded that the residual risk to data subjects is low, given our architectural decision not to store raw HTML content or APK files, our use of encryption in transit and at rest, our strict access controls, and our limited data retention periods. The full DPIA is available upon request to the relevant supervisory authority and, on a summary basis, to data subjects who wish to understand the measures we have taken to protect their data. We review and update the DPIA annually, and whenever there is a significant change to our processing activities that may affect the risk assessment.
            </p>
            <p>
              We do not engage in systematic and extensive profiling, automated decision-making that produces legal effects, large-scale processing of special categories of data, or public-area surveillance. These are the categories of processing that the GDPR identifies as most likely to require a DPIA, and since our service does not involve any of these activities, the DPIA requirements are limited to the core processing activities described above.
            </p>
          </section>

          {/* 15. Changes */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">15. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, changes in applicable law, or changes in the features and functionality of our service. The &quot;Last updated&quot; date at the top of this page indicates when the most recent revision was made. We encourage you to review this page periodically to stay informed about how we collect, use, and protect your data.
            </p>
            <p className="mb-4">
              If we make material changes to this Privacy Policy — that is, changes that significantly affect how we collect, use, share, or retain your personal data — we will notify you by sending an email to the address associated with your account at least 30 days before the changes take effect. We will also display a prominent notice on our website during the notification period. Material changes include, but are not limited to, changes to the categories of data we collect, new purposes for processing, changes to data sharing practices, or modifications to your rights as a data subject.
            </p>
            <p>
              Your continued use of Pulse AI after the updated policy takes effect constitutes your acceptance of the revised terms. If you do not agree with any material change to this Privacy Policy, you may terminate your account and request deletion of your personal data as described in Section 9 before the changes take effect.
            </p>
          </section>

          {/* 16. Contact */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">16. Contact Us</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy, our data processing practices, or your rights under applicable data protection law, please do not hesitate to contact us. We are committed to providing transparent and timely responses to all data-related inquiries.
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">Data Protection Officer (DPO)</p>
                  <p className="text-xs">dpo@pulseai.app</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">General Privacy Inquiries</p>
                  <p className="text-xs">privacy@pulseai.app</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">Website</p>
                  <p className="text-xs">pulseai.vercel.app</p>
                </div>
              </div>
            </div>
            <p className="mb-4">
              Under the GDPR, you have the right to lodge a complaint with the supervisory authority in your EU member state of residence if you believe that our processing of your personal data violates the GDPR. A list of EU supervisory authorities is available at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">edpb.europa.eu/about-edpb/about-edpb/members_en</code>. You may also contact the Irish Data Protection Commission, which is our lead supervisory authority for GDPR purposes, at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">dataprotection.ie</code>.
            </p>
            <p>
              Under the DPDP Act, 2023, you have the right to file a complaint with the Data Protection Board of India if you believe that our processing of your personal data violates the Act. Information about filing complaints with the Data Protection Board is available on the official website of the Government of India. We encourage you to contact us directly first, as we are committed to resolving any concerns you may have without the need for formal regulatory intervention.
            </p>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <button onClick={() => navigate('landing')} className="flex items-center gap-2 mb-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                  <HeartPulse className="h-3 w-3 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">Pulse AI</span>
              </button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI-powered website audit tool and Android APK scanner. Get product health scores, security reports, and AI-written action plans.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('landing')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Features</button>
                <button onClick={() => navigate('auth')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Get Started</button>
                <button onClick={() => navigate('blog', '0')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Blog</button>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Resources</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('blog', '0')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Why Lighthouse Scores Lie</button>
                <button onClick={() => navigate('blog', '1')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Security Headers Guide</button>
                <button onClick={() => navigate('blog', '2')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">APK Security Analysis</button>
              </nav>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
              <nav className="flex flex-col gap-2">
                <button onClick={() => navigate('privacy')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Privacy Policy</button>
                <button onClick={() => navigate('terms')} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">Terms &amp; Conditions</button>
              </nav>
            </div>
          </div>
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Pulse AI. AI-powered product intelligence platform.
            </p>
            <nav className="flex items-center gap-5 text-xs text-muted-foreground">
              <button onClick={() => navigate('landing')} className="hover:text-foreground transition-colors">Features</button>
              <button onClick={() => navigate('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => navigate('terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => navigate('auth')} className="hover:text-foreground transition-colors">Sign in</button>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
