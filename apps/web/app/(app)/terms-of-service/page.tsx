'use client';

import dynamic from 'next/dynamic';

const Logo = dynamic(() => import('@/components/logo'), { ssr: false });

export default function TermsOfServicePage() {
  return (
    <div className="min-h-dvh p-4 flex bg-white">
      <div className="rounded-3xl w-full flex flex-col items-center from-primary/20 to-background p-4 bg-[url('/bg.webp')] bg-cover bg-center">
        <div className="w-full max-w-3xl flex flex-col items-center space-y-8 py-8">
          <div className="w-full p-0 pt-4">
            <div className="max-w-md mx-auto flex flex-start justify-center">
              <Logo width={300} height={160} className="sm:w-[400px] sm:h-[214px]" />
            </div>
          </div>

          <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-10 shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold text-black mb-6 text-center">
              Terms of Service of Postea
            </h1>

            <div className="prose prose-sm md:prose-base max-w-none text-black space-y-6">
              <p className="text-gray-600 font-medium">
                <strong>Effective Date:</strong> [Insert Effective Date]
              </p>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
                <p>
                  By downloading, accessing, or using the Postea application (the &quot;App&quot;), you agree to comply with and be bound by these Terms of Service (the &quot;Terms&quot;). If you do not agree to these Terms, please do not use the App.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">2. Changes to Terms</h2>
                <p>
                  We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the App after any changes constitutes your acceptance of the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">3. Eligibility</h2>
                <p>
                  You must be at least 18 years old to use this App. By using the App, you represent and warrant that you meet this eligibility requirement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">4. Account Registration</h2>
                <p>
                  To access certain features of the App, you may be required to create an account. You agree to provide accurate and complete information during the registration process and to update such information to keep it accurate and complete. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">5. User Conduct</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    Impersonate or attempt to impersonate Postea, a Postea employee, another user, or any other person or entity.
                  </li>
                  <li>
                    Engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the App, or which, as determined by Postea, may harm Postea or users of the App or expose them to liability.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">6. Intellectual Property</h2>
                <p>
                  The App and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, and audio) are owned by Postea, its licensors, or other providers of such material and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">7. License to Use the App</h2>
                <p>
                  Subject to your compliance with these Terms, Postea grants you a limited, non-exclusive, non-transferable, and revocable license to download and use the App solely for your personal, non-commercial use.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">8. Third-Party Services</h2>
                <p>
                  The App may contain links to third-party websites or services that are not owned or controlled by Postea. Postea has no control over, and assumes no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You acknowledge and agree that Postea shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of any such content, goods, or services available on or through any such websites or services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">9. Disclaimers</h2>
                <p>
                  The App is provided on an &quot;as is&quot; and &quot;as available&quot; basis. Postea makes no representations or warranties of any kind, express or implied, as to the operation of the App or the information, content, materials, or products included in the App. You expressly agree that your use of the App is at your sole risk.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mt-6 mb-3">10. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by applicable law, in no event shall Postea, its affiliates, directors, employees, agents, licensors, or service providers be liable for any indirect, punitive, incidental, special, consequential damages, or any damages whatsoever, including but not limited to damages for loss of use, data, or profits, arising out of or in any way connected with the use of the App.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
