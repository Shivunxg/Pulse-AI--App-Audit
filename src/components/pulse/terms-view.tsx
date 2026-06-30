'use client';

import { useAppStore } from '@/store/use-app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HeartPulse, Shield, Mail, Globe } from 'lucide-react';

export function TermsView() {
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
            <span className="text-muted-foreground">Terms &amp; Conditions</span>
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
            <span className="text-sm text-muted-foreground">Effective: June 30, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.2]">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            These Terms and Conditions govern your use of the Pulse AI website audit tool, Android APK scanner, and all related services. By accessing or using Pulse AI, you agree to be bound by these terms. Please read them carefully before using our service.
          </p>
        </div>

        {/* CONTENT */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-16 space-y-10 text-sm leading-relaxed text-muted-foreground">

          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing, using, or registering for the Pulse AI service, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions, as well as our Privacy Policy, which is incorporated into these terms by reference. If you do not agree to these terms, you must not use our service. Your continued use of Pulse AI after the publication of any amendments to these terms constitutes your acceptance of those amendments. We recommend that you review these terms periodically to stay informed of any changes.
            </p>
            <p className="mb-4">
              These terms constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and Pulse AI (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). If you are using the service on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these terms, and the terms &quot;User&quot; and &quot;you&quot; will refer to that organization. In the event of any conflict between these terms and our Privacy Policy, the terms that provide greater protection for your personal data shall prevail.
            </p>
            <p>
              By creating an account, you confirm that you are at least 18 years of age (or the age of majority in your jurisdiction) and have the legal capacity to enter into a binding agreement. If you are under the required age, you may not use our service, and any account created in violation of this restriction may be terminated without notice.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">2. Description of Service</h2>
            <p className="mb-4">
              Pulse AI is an AI-powered product intelligence platform that provides website audit and Android APK security scanning services. The service is delivered through a web-based dashboard accessible at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">pulseai.vercel.app</code> and associated API endpoints. Our core features include the following capabilities, each of which is provided as part of the overall service and subject to the terms described herein.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>Website Audit:</strong> Automated analysis of publicly accessible websites across five categories — performance, SEO, accessibility, security, and user experience — with deterministic scoring, detailed findings, and AI-generated executive summaries.
              </li>
              <li>
                <strong>Simple Audit Mode:</strong> HTTP-level analysis that completes in approximately 10 seconds, checking server response times, page sizes, meta tags, security headers, and basic accessibility markers without rendering the page.
              </li>
              <li>
                <strong>Deep Audit Mode:</strong> Browser-based analysis using Playwright that captures Core Web Vitals (LCP, FCP, CLS, TTI), console errors, rendered DOM analysis, broken links, and responsive behavior over 30-60 seconds.
              </li>
              <li>
                <strong>Android APK Security Scanner:</strong> Upload-based analysis of Android APK files that detects permission issues, tracker and SDK identification, hardcoded secrets, certificate analysis, network security configuration, and code quality indicators.
              </li>
              <li>
                <strong>AI-Powered Summaries:</strong> Machine-generated executive summaries, prioritized action items, and plain-English recommendations based on the deterministic findings of each audit.
              </li>
            </ul>
            <p className="mb-4">
              The service is provided to you &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, express or implied, except as expressly stated in these terms. We reserve the right to modify, suspend, or discontinue any feature or aspect of the service at any time, with or without notice, as described in Section 18 of these terms. Any new features added to the current service shall also be subject to these terms.
            </p>
            <p>
              You acknowledge that the service is provided for informational and educational purposes, and that the audit results, scores, and AI-generated summaries constitute our professional opinion based on automated analysis. Pulse AI is not a replacement for professional security audits, penetration testing, or legal compliance reviews, and you should not rely solely on our findings for decisions that could result in legal liability, financial loss, or safety risks.
            </p>
          </section>

          {/* 3. Account Registration */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">3. Account Registration</h2>
            <p className="mb-4">
              To access the full functionality of Pulse AI, you must create an account by providing a valid email address and authenticating through our supported methods. You are responsible for maintaining the accuracy and completeness of your account information, and you must notify us promptly of any changes to your email address or other relevant details. Providing false, misleading, or incomplete information during registration may result in the suspension or termination of your account.
            </p>
            <p className="mb-4">
              You are solely responsible for maintaining the confidentiality and security of your account credentials. This includes your password (if using email-based authentication), your Google OAuth authorization, and your JWT session token. You must not share your login credentials with any other person, and you must immediately notify us if you suspect that your account has been compromised or accessed without your authorization. Pulse AI will not be liable for any loss or damage arising from your failure to maintain the security of your account.
            </p>
            <p>
              We support Google OAuth as a primary authentication method and email-based authentication as an alternative. When using Google OAuth, you are subject to Google's own terms of service and privacy practices in addition to our terms. We do not store your Google password — authentication is handled entirely by Google's OAuth infrastructure, and we receive only the authorization tokens and basic profile information (email address and display name) necessary to create your account.
            </p>
          </section>

          {/* 4. Acceptable Use */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">4. Acceptable Use</h2>
            <p className="mb-4">
              You agree to use Pulse AI only for lawful purposes and in accordance with these terms. You are responsible for ensuring that your use of the service complies with all applicable local, state, national, and international laws and regulations. The following activities are strictly prohibited, and any user found engaging in these activities will have their account terminated immediately without prior notice or refund.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>Unauthorized Scanning:</strong> You must not use Pulse AI to scan, audit, or analyze any website, web application, or API endpoint that you do not own or have explicit, documented authorization to test. Scanning third-party websites without permission may violate applicable computer fraud, unauthorized access, and anti-harassment laws.
              </li>
              <li>
                <strong>Malware Analysis:</strong> You must not upload malware, ransomware, spyware, or any other malicious software to our APK scanning service. Our service is designed for legitimate Android application security analysis, not for hosting, distributing, or analyzing offensive security tools.
              </li>
              <li>
                <strong>Web Scraping:</strong> You must not use Pulse AI as a tool to extract, scrape, or harvest data, content, or intellectual property from websites that you do not own or have authorization to access. The audit results are provided for the purpose of improving the audited site's quality, not for data extraction.
              </li>
              <li>
                <strong>Abuse of Infrastructure:</strong> You must not attempt to overwhelm, degrade, or disrupt Pulse AI's servers, networks, or infrastructure through excessive API calls, automated scripts, denial-of-service techniques, or any other form of resource abuse.
              </li>
              <li>
                <strong>Reverse Engineering:</strong> You must not reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of Pulse AI, its audit engine, or its AI integration layer, except as permitted by applicable mandatory law.
              </li>
              <li>
                <strong>Circumventing Rate Limits:</strong> You must not use techniques such as proxy rotation, multiple account creation, or header spoofing to circumvent the audit rate limits, API throttling, or usage quotas associated with your subscription plan.
              </li>
              <li>
                <strong>Fraudulent Activity:</strong> You must not use Pulse AI to generate fake audit reports, forge security assessments, or misrepresent the security or quality status of any product or website for deceptive purposes.
              </li>
              <li>
                <strong>Sharing Credentials:</strong> You must not share your account credentials with other individuals or allow third parties to access your account through shared login information or session tokens.
              </li>
              <li>
                <strong>Interfering with Other Users:</strong> You must not interfere with, disrupt, or impair the use of Pulse AI by other users, including through the submission of audit requests designed to cause system errors or generate misleading results.
              </li>
              <li>
                <strong>Violation of Third-Party Rights:</strong> You must not use Pulse AI in any way that infringes upon the intellectual property rights, privacy rights, or any other legal rights of any third party.
              </li>
            </ul>
            <p>
              We reserve the right to investigate and take appropriate action against any user who, in our sole discretion, violates these acceptable use provisions. This includes, without limitation, suspending or terminating the offending account, restricting access to specific features, and, in cases of severe or repeated violations, reporting the activity to relevant law enforcement authorities.
            </p>
          </section>

          {/* 5. Intellectual Property */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">5. Intellectual Property</h2>
            <p className="mb-4">
              All intellectual property rights in the Pulse AI service, including but not limited to the website design, user interface, audit engine, scoring algorithms, AI integration logic, API endpoints, documentation, branding, logos, and trademarks, are owned by or licensed to Pulse AI. These rights are protected by applicable intellectual property laws, including copyright, trademark, patent, and trade secret laws. Nothing in these terms grants you any ownership interest in or license to use any Pulse AI intellectual property except as expressly described in this section.
            </p>
            <p className="mb-4">
              You retain all rights to the content you submit to Pulse AI for auditing, including website URLs, APK files, and any associated project metadata. However, by submitting content for analysis, you grant Pulse AI a limited, non-exclusive, non-transferable, revocable license to process, analyze, and generate audit findings from that content solely for the purpose of providing the service to you. We do not claim ownership of your content, and we do not use it for any purpose other than delivering the audit results you requested.
            </p>
            <p className="mb-4">
              You may not copy, modify, distribute, sell, lease, or otherwise exploit any portion of the Pulse AI service or its underlying code without our express written permission. You may not remove, alter, or obscure any proprietary notices, labels, or marks displayed on or within the service. Any unauthorized use of our intellectual property constitutes a material breach of these terms and may result in legal action.
            </p>
            <p>
              The AI-generated summaries and recommendations produced by Pulse AI are based on deterministic audit findings and are provided for informational purposes. While you may use and share these summaries in connection with your audit results, you may not represent them as your own original work or use them to train competing AI models or services. The method, algorithms, and architecture used to generate AI summaries constitute trade secrets and proprietary intellectual property of Pulse AI.
            </p>
          </section>

          {/* 6. User Content */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">6. User Content</h2>
            <p className="mb-4">
              &quot;User Content&quot; refers to any data, files, URLs, or information that you submit to Pulse AI for the purpose of using the service, including website URLs entered for auditing and Android APK files uploaded for security scanning. You are solely responsible for your User Content and the consequences of submitting it to our service.
            </p>
            <p className="mb-4">
              By submitting User Content, you represent and warrant the following: First, that you are the owner of the User Content or have obtained all necessary rights, permissions, and authorizations to submit it for analysis. Second, that your User Content does not contain any malware, viruses, or other harmful code that could damage Pulse AI's infrastructure or affect other users. Third, that your submission of User Content for analysis does not violate any applicable law, regulation, or third-party right. Fourth, that you have the right to grant Pulse AI the limited license described in Section 5 to process your User Content for the purpose of delivering the service.
            </p>
            <p>
              Pulse AI does not pre-screen or editorially review User Content before processing it through our audit engine. However, we reserve the right to refuse, reject, or remove any User Content at our sole discretion if we believe it violates these terms, poses a security risk, or is otherwise inappropriate for processing. We are not responsible for any loss, damage, or liability arising from your submission of User Content or from the audit results generated from it.
            </p>
          </section>

          {/* 7. Subscription Plans */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">7. Subscription Plans</h2>

            <h3 className="text-sm font-bold text-foreground mb-2">7.1 Free Plan</h3>
            <p className="mb-4">
              The Free Plan is available at no cost and provides access to a limited number of audits per month as defined on our pricing page. The Free Plan includes basic audit functionality, AI-generated summaries, and access to the dashboard. We reserve the right to modify the features, audit limits, or availability of the Free Plan at any time with reasonable notice. If the Free Plan is no longer offered, existing Free Plan users will be given 30 days to upgrade to a paid plan or export their data before their accounts are downgraded to read-only access.
            </p>

            <h3 className="text-sm font-bold text-foreground mb-2">7.2 Pro Plan</h3>
            <p className="mb-4">
              The Pro Plan is available at $19 per month (or the equivalent in your local currency as displayed at checkout) and provides access to unlimited simple and deep audits, API access, team collaboration features, and priority support. Pro Plan pricing is subject to change with 30 days&apos; advance notice as described in Section 18. All fees are charged in advance on a recurring monthly basis through our payment processor, Stripe. Taxes may apply depending on your jurisdiction and will be displayed at checkout.
            </p>

            <h3 className="text-sm font-bold text-foreground mb-2">7.3 Billing and Cancellation</h3>
            <p className="mb-4">
              Paid subscriptions are billed automatically on a monthly basis using the payment method you provided during registration. Your subscription will auto-renew at the end of each billing period unless you cancel it before the renewal date. You may cancel your subscription at any time through your account settings or by contacting us at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">support@pulseai.app</code>. Upon cancellation, you will retain access to your paid plan features until the end of the current billing period, after which your account will be downgraded to the Free Plan. We do not offer prorated refunds for partial months.
            </p>
            <p className="mb-4">
              We require 30 days&apos; notice for subscription cancellations if you wish to prevent the next billing cycle from being charged. If you cancel within the billing period but after the auto-renewal charge has been processed, the charge for that period is non-refundable. You will continue to have access to the paid plan features for the duration of the paid period. We reserve the right to change our pricing with 30 days&apos; advance notice as described in Section 18 of these terms.
            </p>

            <h3 className="text-sm font-bold text-foreground mb-2">7.4 Enterprise Plan</h3>
            <p>
              Enterprise Plans are available for organizations that require custom features, SSO/SAML integration, dedicated support, SLA guarantees, or on-premise deployment options. Enterprise Plans are subject to separate custom agreements that supersede the billing and plan provisions of this section. For Enterprise pricing and custom agreements, please contact us at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">support@pulseai.app</code>.
            </p>
          </section>

          {/* 8. Disclaimer of Warranties */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">8. Disclaimer of Warranties</h2>
            <p className="mb-4 uppercase font-semibold tracking-wide">
              PULSE AI IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-4">
              We do not warrant that the Pulse AI service will be uninterrupted, timely, secure, or error-free. The audit results, health scores, security findings, and AI-generated summaries are based on automated analysis and represent our best effort assessment at the time of the audit. They do not constitute a guarantee, certification, or professional security opinion that meets any specific industry standard. You should not rely on Pulse AI as your sole source of security assessment, compliance verification, or performance evaluation.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>No Warranty of Accuracy:</strong> We do not warrant that the audit results, scores, or AI-generated summaries are completely accurate, comprehensive, or up-to-date. The findings are based on automated analysis at a point in time and may not reflect all issues, vulnerabilities, or performance characteristics of the audited target.
              </li>
              <li>
                <strong>No Warranty of Non-Infringement:</strong> We do not warrant that the Pulse AI service, or any content, features, or functionality provided through the service, does not infringe upon the intellectual property rights of any third party.
              </li>
              <li>
                <strong>No Warranty of Security:</strong> While we implement industry-standard security measures, we do not warrant that the Pulse AI service is immune from security vulnerabilities, data breaches, or unauthorized access. No method of electronic storage or transmission is 100% secure.
              </li>
              <li>
                <strong>No Warranty of Compatibility:</strong> We do not warrant that the Pulse AI service is compatible with all browsers, devices, operating systems, or configurations. The service is optimized for modern, supported versions of major web browsers.
              </li>
            </ul>
            <p className="uppercase font-semibold tracking-wide">
              YOU ACKNOWLEDGE AND AGREE THAT YOUR USE OF THE SERVICE IS AT YOUR SOLE RISK AND THAT ANY RELIANCE ON THE SERVICE OR ITS RESULTS IS ENTIRELY AT YOUR OWN DISCRETION.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">9. Limitation of Liability</h2>
            <p className="mb-4 uppercase font-semibold tracking-wide">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PULSE AI, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AFFILIATES, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, BUSINESS OPPORTUNITIES, OR OTHER ECONOMIC ADVANTAGE, REGARDLESS OF WHETHER SUCH DAMAGES ARE BASED ON CONTRACT, TORT, STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND REGARDLESS OF WHETHER PULSE AI WAS ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mb-4">
              In no event shall our total aggregate liability to you for all claims arising out of or related to these terms or your use of the service exceed the greater of (a) the total amount you have actually paid to Pulse AI in the twelve (12) months immediately preceding the event giving rise to the claim, or (b) <strong>one hundred US dollars ($100.00)</strong>. This limitation applies regardless of the legal theory on which the claim is based and regardless of whether the claim is for breach of contract, breach of warranty, negligence, strict liability, or any other cause of action.
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <strong>Loss of Data:</strong> We are not liable for any loss, corruption, or unauthorized access to your audit results, project data, or any other information stored on our platform, even if such loss results from our negligence or a security breach on our systems.
              </li>
              <li>
                <strong>Inaccurate Results:</strong> We are not liable for any damages arising from the use of, reliance upon, or decisions made based on audit results, health scores, security findings, or AI-generated summaries, even if such results are incomplete, inaccurate, or misleading.
              </li>
              <li>
                <strong>Service Interruption:</strong> We are not liable for any damages arising from service interruptions, downtime, latency, or unavailability of the Pulse AI platform, regardless of the cause or duration of the interruption.
              </li>
              <li>
                <strong>Third-Party Actions:</strong> We are not liable for any damages arising from the actions, errors, or omissions of third-party service providers, including but not limited to our authentication provider (Firebase/Google), database provider (Supabase), payment processor (Stripe), and AI provider.
              </li>
              <li>
                <strong>User Content:</strong> We are not liable for any damages arising from the User Content you submit to the service, including but not limited to the consequences of auditing unauthorized websites, uploading malicious APK files, or submitting data that infringes on third-party rights.
              </li>
              <li>
                <strong>Security Breaches:</strong> To the extent permitted by law, we are not liable for damages arising from any security breach, data leak, or unauthorized access to our systems, except where such breach results from our gross negligence or willful misconduct.
              </li>
            </ul>
            <p className="uppercase font-semibold tracking-wide">
              THE LIMITATIONS OF LIABILITY IN THIS SECTION ARE FUNDAMENTAL ELEMENTS OF THE BASIS OF THE BARGAIN BETWEEN YOU AND PULSE AI. WITHOUT SUCH LIMITATIONS, WE WOULD NOT BE ABLE TO OFFER THE SERVICE ON THE TERMS DESCRIBED HEREIN. IF ANY JURISDICTION DOES NOT PERMIT THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL OR INCIDENTAL DAMAGES, OUR LIABILITY IN THAT JURISDICTION SHALL BE LIMITED TO THE MAXIMUM EXTENT PERMITTED BY LAW.
            </p>
          </section>

          {/* 10. Indemnification */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">10. Indemnification</h2>
            <p className="mb-4">
              You agree to indemnify, defend, and hold harmless Pulse AI, its officers, directors, employees, agents, affiliates, and licensors from and against any and all claims, demands, suits, actions, proceedings, losses, liabilities, damages, costs, and expenses (including reasonable attorneys&apos; fees and court costs) arising out of or related to: (a) your use of the Pulse AI service in violation of these terms or any applicable law; (b) your submission of User Content that infringes on the intellectual property, privacy, or other rights of any third party; (c) your auditing or scanning of any website, web application, or APK file without proper authorization; (d) any breach of your representations, warranties, or obligations under these terms; and (e) any dispute between you and any third party relating to your use of the service.
            </p>
            <p className="mb-4">
              This indemnification obligation will survive the termination or expiration of these terms and your account. We reserve the right, at our sole discretion, to assume the exclusive defense and control of any matter subject to indemnification by you. In such case, you agree to cooperate with our defense and to provide all reasonably requested information and assistance. Your failure to provide such cooperation may relieve us of our obligation to defend or indemnify you with respect to the specific matter at issue.
            </p>
            <p>
              We will notify you promptly of any claim or action for which we believe indemnification applies, and we will not settle any claim without your prior written consent if the settlement imposes any financial obligation on you or admits fault on your behalf. This indemnification is in addition to, and not in lieu of, any other rights or remedies available to Pulse AI under applicable law or these terms.
            </p>
          </section>

          {/* 11. Data Protection */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">11. Data Protection</h2>
            <p className="mb-4">
              Our collection, use, storage, and sharing of your personal data is governed by our Privacy Policy, which is available at the link displayed on our website and is incorporated into these terms by reference. You should review our Privacy Policy to understand how we handle your data, including the categories of data we collect, the purposes for processing, your rights as a data subject, and the safeguards we implement to protect your information.
            </p>
            <p className="mb-4">
              By using Pulse AI, you consent to the collection and processing of your personal data as described in our Privacy Policy. If you do not agree with our data protection practices, you must not use our service. We are committed to complying with all applicable data protection laws, including the General Data Protection Regulation (GDPR) and the Digital Personal Data Protection Act, 2023 (DPDP Act) of India, and we will update our practices as necessary to maintain compliance.
            </p>
            <p>
              In the event of any conflict between these Terms and Conditions and our Privacy Policy regarding data protection matters, the Privacy Policy shall prevail to the extent of the conflict. Any questions or concerns regarding data protection should be directed to our Data Protection Officer at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">dpo@pulseai.app</code>.
            </p>
          </section>

          {/* 12. Termination */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">12. Termination</h2>
            <p className="mb-4">
              You may terminate your account at any time by using the account deletion feature in your dashboard settings or by contacting us at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">support@pulseai.app</code>. Upon termination, your right to use the Pulse AI service will cease immediately. If you terminate a paid subscription, you will retain access to the paid plan features until the end of the current billing period, after which no further charges will be made.
            </p>
            <p className="mb-4">
              Pulse AI may suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to: (a) violation of these terms; (b) prolonged inactivity (no logins or audit activity for 12 consecutive months); (c) suspected fraud, abuse, or unauthorized access; (d) insolvency, bankruptcy, or dissolution of the user or the user&apos;s organization; or (e) legal or regulatory requirements. We will make reasonable efforts to notify you of any suspension or termination, except where such notification is prohibited by law or would compromise an ongoing investigation.
            </p>
            <p>
              Upon account termination, all audit results, project data, and account information associated with your account will be retained for 30 days to allow for data export and account recovery requests, after which all data will be permanently and irreversibly deleted from our systems. Sections 5, 8, 9, 10, and 13 through 19 of these terms will survive the termination of your account.
            </p>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">13. Governing Law and Dispute Resolution</h2>
            <p className="mb-4">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. The application of the United Nations Convention on Contracts for the International Sale of Goods is expressly excluded. Any disputes arising out of or related to these terms or your use of the Pulse AI service shall be resolved exclusively in accordance with the dispute resolution provisions described in this section.
            </p>
            <p className="mb-4">
              Any dispute, controversy, or claim arising out of or relating to these terms, or the breach, termination, or invalidity thereof, shall be settled by arbitration administered by a sole arbitrator in accordance with the Arbitration and Conciliation Act, 1996 (as amended). The seat of arbitration shall be Bengaluru, India. The language of the arbitration shall be English. The arbitrator&apos;s decision shall be final and binding on both parties and may be enforced in any court of competent jurisdiction.
            </p>
            <p className="mb-4">
              Notwithstanding the arbitration provisions above, you retain the right to lodge a complaint with any applicable data protection supervisory authority regarding our processing of your personal data. Under the GDPR, you may lodge a complaint with the supervisory authority in your EU member state of residence. Under the DPDP Act, 2023, you may file a complaint with the Data Protection Board of India. These complaint rights are preserved and are not subject to the arbitration clause.
            </p>
            <p>
              Either party may seek injunctive or equitable relief in any court of competent jurisdiction to prevent the actual or threatened infringement of intellectual property rights or to prevent irreparable harm, without the requirement to post a bond or prove actual damages. Such injunctive relief shall not be deemed a waiver of the arbitration provisions for any other dispute.
            </p>
          </section>

          {/* 14. Assignment */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">14. Assignment</h2>
            <p className="mb-4">
              You may not assign, transfer, sublicense, or otherwise convey your rights or obligations under these terms to any third party without the express prior written consent of Pulse AI. Any attempted assignment without such consent shall be null and void and shall not create any rights or obligations for the purported assignee. This restriction applies to all forms of assignment, including by operation of law, merger, acquisition, reorganization, or any other method.
            </p>
            <p className="mb-4">
              Pulse AI may assign, transfer, or delegate its rights or obligations under these terms, in whole or in part, to any third party in connection with a merger, acquisition, corporate reorganization, sale of assets, or any other transfer of our business, without your prior consent. In the event of such an assignment, the successor entity shall assume all of Pulse AI&apos;s rights and obligations under these terms, and your rights under these terms shall remain unchanged.
            </p>
            <p>
              These terms shall be binding upon and inure to the benefit of the parties hereto and their respective permitted successors and assigns. Nothing in these terms, express or implied, is intended to confer upon any person or entity other than the parties hereto, or their respective successors and permitted assigns, any rights, remedies, obligations, or liabilities of any nature.
            </p>
          </section>

          {/* 15. Severability */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">15. Severability</h2>
            <p className="mb-4">
              If any provision of these Terms and Conditions is held to be invalid, illegal, unenforceable, or void by any court of competent jurisdiction or arbitrator, that provision shall be modified to the minimum extent necessary to make it valid and enforceable, or if modification is not possible, shall be severed from these terms, and the remaining provisions shall continue in full force and effect. The severability of any provision shall not affect the validity or enforceability of the remaining terms.
            </p>
            <p className="mb-4">
              The invalidity or unenforceability of any provision shall not affect the validity or enforceability of any other provision of these terms, and each provision of these terms shall be construed as separate and independent from every other provision. No court or arbitrator shall modify any other provision to compensate for any provision that is held to be invalid, illegal, or unenforceable.
            </p>
            <p>
              The parties agree that if any provision is held to be overly broad as to scope, duration, activity, or subject, such provision shall be construed by limiting and reducing it so as to be enforceable to the maximum extent permitted by applicable law. This severability clause applies to the entire agreement and to any provision contained within it.
            </p>
          </section>

          {/* 16. Waiver */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">16. Waiver</h2>
            <p className="mb-4">
              No failure or delay by Pulse AI in exercising any right, power, or remedy under these terms shall operate as a waiver of such right, power, or remedy. No waiver of any provision of these terms shall be effective unless made in writing and signed by an authorized representative of the waiving party. A waiver of any provision of these terms in one instance shall not be construed as a waiver of that provision in any other instance, and each waiver shall operate only as a waiver in the specific instance for which it is given.
            </p>
            <p className="mb-4">
              The rights and remedies of Pulse AI under these terms are cumulative and not exclusive. The exercise of one right or remedy does not preclude the simultaneous or subsequent exercise of any other right or remedy. Any waiver must be expressly stated and shall not be implied from any conduct, omission, or course of dealing between the parties.
            </p>
            <p>
              This waiver provision applies to all provisions of these terms and to any amendments, modifications, or replacements thereof. The failure of either party to enforce any right under these terms at any time shall not be construed as a permanent waiver of such right or any other right, and no waiver shall be binding unless confirmed in writing.
            </p>
          </section>

          {/* 17. Entire Agreement */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">17. Entire Agreement</h2>
            <p className="mb-4">
              These Terms and Conditions, together with our Privacy Policy and any additional terms or agreements that are specifically referenced herein or provided to you in connection with a specific feature of the service (such as Enterprise Plan agreements), constitute the entire agreement between you and Pulse AI regarding the use of the Pulse AI service. These terms supersede all prior or contemporaneous communications, representations, proposals, and agreements, whether oral or written, with respect to the subject matter of these terms.
            </p>
            <p className="mb-4">
              You acknowledge that you have not relied on any representation, statement, or warranty other than those expressly set forth in these terms in deciding to use the Pulse AI service. Any pre-contractual statements, marketing materials, feature descriptions, or communications are superseded by the express terms of this agreement and do not form part of the contract between the parties.
            </p>
            <p>
              No modification, amendment, supplement to, or waiver of these terms shall be binding unless made in writing and signed by an authorized representative of both parties. Any conflicting terms proposed by you in any purchase order, acceptance form, or other document shall be null and void and shall have no legal effect unless expressly agreed to in writing by Pulse AI.
            </p>
          </section>

          {/* 18. Changes */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">18. Changes to These Terms</h2>
            <p className="mb-4">
              Pulse AI reserves the right to modify, amend, or update these Terms and Conditions at any time. The &quot;Effective&quot; date at the top of this page indicates when the most recent revision was made. We may make non-material changes (such as correcting typographical errors, updating contact information, or clarifying existing provisions) at any time without advance notice. For material changes that significantly affect your rights or obligations — such as changes to fees, scope of service, warranty disclaimers, or limitation of liability provisions — we will provide at least 30 days&apos; advance notice by sending an email to the address associated with your account and by displaying a prominent notice on our website.
            </p>
            <p className="mb-4">
              The updated terms will become effective on the date specified in the notice (or, if no date is specified, on the date the updated terms are published). Your continued use of Pulse AI after the updated terms take effect constitutes your acceptance of the revised terms. If you do not agree with any material change to these terms, you must stop using the service and terminate your account before the changes take effect, as described in Section 12. You may request a copy of the previous version of these terms by contacting us at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">legal@pulseai.app</code>.
            </p>
            <p>
              We encourage you to review these terms periodically to stay informed about any changes that may affect your use of the service. Material changes to these terms will be summarized in the notification email so that you can quickly identify what has changed without reading the entire document.
            </p>
          </section>

          {/* 19. Contact */}
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">19. Contact Us</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact us using the information provided below. We are committed to providing clear and timely responses to all inquiries.
            </p>
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground text-xs">Legal Inquiries</p>
                  <p className="text-xs">legal@pulseai.app</p>
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
            <p>
              For data protection inquiries, please contact our Data Protection Officer at <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">dpo@pulseai.app</code>. For billing and subscription inquiries, please contact <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">support@pulseai.app</code>. We will respond to all inquiries within 5 business days.
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
