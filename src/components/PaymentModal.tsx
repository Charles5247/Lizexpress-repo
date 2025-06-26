import React, { useState } from 'react';
import { X, CreditCard, Shield, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemValue: number;
  onPaymentSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, itemValue, onPaymentSuccess }) => {
  const [showTerms, setShowTerms] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const listingFee = Math.round(itemValue * 0.05); // 5% of item value

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    setShowTerms(false);
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Initialize Flutterwave payment
      const flutterwaveConfig = {
        public_key: "FLWPUBK_TEST-SANDBOXDEMOKEY-X", // Replace with your actual public key
        tx_ref: `lizexpress_${Date.now()}`,
        amount: listingFee,
        currency: "NGN",
        payment_options: "card,mobilemoney,ussd",
        customer: {
          email: "customer@example.com",
          phone_number: "080****4528",
          name: "Customer Name",
        },
        customizations: {
          title: "LizExpress Listing Fee",
          description: `Payment for listing item (5% of ₦${itemValue.toLocaleString()})`,
          logo: "https://imgur.com/CtN9l7s.png",
        },
      };

      // @ts-ignore - FlutterwaveCheckout is loaded from CDN
      if (typeof FlutterwaveCheckout !== 'undefined') {
        FlutterwaveCheckout(flutterwaveConfig);
      } else {
        // Fallback: simulate payment success for demo
        setTimeout(() => {
          onPaymentSuccess();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {showTerms ? (
          // Terms and Conditions
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#4A0E67]">Terms & Conditions</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-700 max-h-96 overflow-y-auto">
              <div>
                <h3 className="font-bold text-[#4A0E67] mb-2">LizExpress Terms & Conditions</h3>
                <p className="text-xs text-gray-500 mb-4">Last updated: June 2025</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">1. Account Opening</h4>
                <p className="mb-2">To access and use the Services, you must register for a LizExpress account ("Account"). During registration, you must provide your full legal name, address, phone number, valid email address, and any other required information. LizExpress reserves the right to reject or cancel any account at our sole discretion.</p>
                
                <p className="mb-2">You must be either:</p>
                <ul className="list-disc list-inside ml-4 mb-2">
                  <li>At least 18 years old, or</li>
                  <li>The age of majority in your jurisdiction, whichever is higher.</li>
                </ul>

                <p className="mb-2">You confirm that you are accessing LizExpress Services for business purposes only, not for personal, family, or household use.</p>
                
                <p className="mb-2">The email address provided at registration will serve as your Primary Email Address. You must monitor it regularly, and communications will only be authenticated if sent from this address.</p>
                
                <p className="mb-2">You are solely responsible for keeping your account credentials secure. LizExpress is not liable for any damages or losses resulting from compromised credentials.</p>
                
                <p className="mb-2">Technical support is available only to LizExpress account holders. Direct inquiries regarding these Terms to LizExpress Support.</p>
                
                <p className="mb-2">You agree not to reproduce, duplicate, copy, sell, resell, or exploit any part of the Services without express written permission from LizExpress.</p>
                
                <p className="mb-2">You may not bypass, reverse engineer, disable, or circumvent any part of the LizExpress platform or its technical features.</p>
                
                <p>You agree not to access or monitor any part of the Services using automated tools like robots, spiders, or scrapers.</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">2. LizExpress Rights</h4>
                <p className="mb-2">LizExpress retains full control over who may access or use the Services and can modify or terminate any feature without prior notice.</p>
                
                <p className="mb-2">We reserve the right to provide our Services to competitors and other third parties, without sharing your confidential information.</p>
                
                <p className="mb-2">We may remove or reject any uploaded materials ("Materials") at our discretion if they violate these Terms or applicable laws.</p>
                
                <p className="mb-2">Abuse (verbal or written) towards LizExpress employees or representatives will result in immediate account termination.</p>
                
                <p className="mb-2">In case of an account ownership dispute, LizExpress may:</p>
                <ul className="list-disc list-inside ml-4 mb-2">
                  <li>Request proof of ownership (business license, ID, last four digits of a credit card, etc.)</li>
                  <li>Transfer, freeze, or suspend the account until rightful ownership is established</li>
                </ul>
                
                <p>LizExpress does not guarantee availability of all features or services in all locations or to all users.</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">3. Your Responsibilities</h4>
                <p className="mb-2">You are responsible for your LizExpress account, the goods/services you sell, and your relationships with customers. LizExpress merely provides the platform.</p>
                
                <p className="mb-2">You must provide clear, public-facing contact information, a refund policy, and order fulfillment timelines on your LizExpress account.</p>
                
                <p className="mb-2">LizExpress is not a marketplace. All transactions are directly between you and your customer. You are responsible for:</p>
                <ul className="list-disc list-inside ml-4 mb-2">
                  <li>Authorizing charges</li>
                  <li>Fulfilling orders</li>
                  <li>Handling returns/refunds</li>
                  <li>Customer service</li>
                  <li>Compliance with all applicable laws and disclosures</li>
                </ul>
                
                <p className="mb-2">You are fully responsible for the accuracy of your product descriptions, pricing, taxes, promotional content, and legal compliance (including consumer protection and regulatory requirements).</p>
                
                <p>You may not use the platform for any illegal or unauthorized purposes or violate any laws (including copyright laws) in your jurisdiction or your customer's.</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">4. Confidentiality</h4>
                <p className="mb-2">Confidential Information includes any non-public business, technical, customer, financial, or strategic information disclosed between parties.</p>
                
                <p className="mb-2">Both parties agree to:</p>
                <ul className="list-disc list-inside ml-4 mb-2">
                  <li>Use Confidential Information solely to fulfill obligations under these Terms</li>
                  <li>Protect it from unauthorized disclosure or use</li>
                  <li>Take reasonable measures to maintain confidentiality</li>
                </ul>
                
                <p>LizExpress's Confidential Information includes all proprietary information not known to the general public, such as system architecture and security practices.</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">5. Limitation of Liability and Indemnification</h4>
                <p className="mb-2">The Services are provided "as is" and "as available" without warranties. LizExpress does not guarantee uninterrupted or error-free operation.</p>
                
                <p className="mb-2">To the maximum extent permitted by law, LizExpress and its suppliers are not liable for any direct, indirect, incidental, or consequential damages—including loss of profits, goodwill, or data.</p>
                
                <p className="mb-2">You are responsible for any breach of these Terms by your employees, agents, or subcontractors.</p>
                
                <p className="mb-2">LizExpress does not guarantee the accuracy of results or content and is not responsible for your tax obligations or liabilities.</p>
                
                <p>We do not warrant the quality of any products, services, or information obtained through the Services or that issues will be corrected.</p>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">6. Intellectual Property and Your Materials</h4>
                <p className="mb-2">You retain ownership of all content and materials you upload to LizExpress. However, by uploading, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and promote that content through our Services.</p>
                
                <p className="mb-2">You are responsible for ensuring that your content:</p>
                <ul className="list-disc list-inside ml-4 mb-2">
                  <li>Does not infringe on any third-party rights</li>
                  <li>Is legally compliant</li>
                  <li>Is accurate and true</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-[#F7941D] mb-2">7. Feedback and Reviews</h4>
                <p>LizExpress welcomes feedback, reviews, and suggestions. However, such feedback is not considered confidential, and we may use it without obligation to compensate or notify you. By submitting feedback or reviews, you grant LizExpress permission to use, display, or implement your suggestions to improve the platform or third-party offerings.</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">Important Notice</p>
                  <p className="text-sm text-yellow-700">By proceeding with payment, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptTerms}
                className="flex-1 px-6 py-3 bg-[#4A0E67] text-white rounded-lg hover:bg-[#3a0b50] transition-colors"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        ) : (
          // Payment Form
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#4A0E67]">Listing Payment</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="bg-[#F7941D]/10 border border-[#F7941D]/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[#4A0E67]">Listing Fee (5%)</h3>
                  <p className="text-sm text-gray-600">Item Value: ₦{itemValue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#F7941D]">₦{listingFee.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">One-time fee</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure payment powered by Flutterwave</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <span>Supports cards, mobile money, and bank transfers</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Why do we charge a listing fee?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensures serious sellers and quality listings</li>
                <li>• Helps maintain platform security and features</li>
                <li>• Supports customer service and dispute resolution</li>
                <li>• Enables continuous platform improvements</li>
              </ul>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-[#F7941D] text-white py-3 rounded-lg font-bold hover:bg-[#e68a1c] transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₦{listingFee.toLocaleString()} Now
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By clicking "Pay Now", you agree to our Terms & Conditions and authorize the payment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;