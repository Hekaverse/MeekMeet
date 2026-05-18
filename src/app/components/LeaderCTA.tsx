"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  MapPin,
  Mail,
  User,
  Church,
  Send,
  CheckCircle,
  Heart,
  Phone,
  Shield,
  HeartPulse,
  FileCheck,
  Upload,
  AlertCircle,
  Calendar,
  Users,
} from "lucide-react";
import AsciiArt from "./AsciiArt";

interface FormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  denomination: string;
  wwccNumber: string;
  wwccExpiry: string;
  policeCheckDate: string;
  firstAidExpiry: string;
  emergencyName: string;
  emergencyPhone: string;
  referenceName: string;
  referenceContact: string;
  hasReadPolicy: boolean;
  documentsAccurate: boolean;
  understandsChecks: boolean;
}

const initialForm: FormData = {
  name: "",
  email: "",
  phone: "",
  location: "",
  denomination: "",
  wwccNumber: "",
  wwccExpiry: "",
  policeCheckDate: "",
  firstAidExpiry: "",
  emergencyName: "",
  emergencyPhone: "",
  referenceName: "",
  referenceContact: "",
  hasReadPolicy: false,
  documentsAccurate: false,
  understandsChecks: false,
};

export default function LeaderCTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialForm);

  const allChecked =
    formData.hasReadPolicy &&
    formData.documentsAccurate &&
    formData.understandsChecks;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) return;
    setSubmitted(true);
  };

  const update = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <section id="join" className="relative py-28 bg-midnight text-cream overflow-hidden grain-texture">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-wheat/5 blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-terracotta/5 blur-[120px]" />

      <div className="absolute top-32 right-10 scripture-watermark text-3xl max-w-[220px] text-wheat/5 text-right hidden xl:block">
        Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.
      </div>

      <div className="absolute top-20 left-6 md:left-12 hidden md:block">
        <AsciiArt name="hands" color="wheat" />
      </div>
      <div className="absolute bottom-20 right-6 md:right-12 hidden md:block">
        <AsciiArt name="cross" color="cream" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left: Copy */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-wheat-light mb-4 block font-medium">
              Step Forward
            </span>
            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-cream mb-6 leading-tight">
              Become a{" "}
              <span className="text-gradient-warm italic">Shepherd</span>
            </h2>
            <div className="ornament-divider max-w-xs mb-8">
              <Heart className="w-4 h-4 text-wheat" strokeWidth={1.5} fill="currentColor" fillOpacity={0.3} />
            </div>
            <p className="text-lg text-cream/70 leading-relaxed mb-6 font-light">
              Every movement begins with one person who says <em>yes</em>. As a
              Meek Meet leader, you become the bridge between your community's
              quiet hopes and the change they long for.
            </p>
            <p className="text-cream/60 leading-relaxed mb-8">
              You will choose the gathering place, curate the questions, welcome
              the conversation, and receive the stories that prove your community's
              needs are real and beautiful. You do not need to be loud.
              You need only be faithful.
            </p>

            <div className="p-6 bg-wheat/5 rounded-2xl border border-wheat/10 mb-8">
              <p className="font-script text-2xl text-wheat/40 mb-2">
                &ldquo;Whoever wants to be first must be slave of all.&rdquo;
              </p>
              <p className="text-sm text-cream/40">— Mark 10:44</p>
            </div>

            <div className="space-y-3">
              {[
                "Automatic new moon scheduling for your location",
                "Warm dashboard to shepherd your community",
                "Curated question library across every domain",
                "Beautiful, anonymised response summaries",
                "Direct support from the Meek Meet family",
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-4 h-4 text-wheat flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-sm text-cream/80">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-midnight-warm/60 backdrop-blur-sm rounded-3xl border border-wheat/15 p-8 md:p-10">
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="font-serif text-2xl text-cream mb-2">
                      Register Your Community
                    </h3>
                    <p className="text-sm text-cream/50">
                      Begin your chapter of the Meek Meet family
                    </p>
                  </div>

                  {/* PERSONAL DETAILS */}
                  <div className="space-y-4">
                    <h4 className="text-xs tracking-[0.2em] uppercase text-wheat-light font-medium flex items-center gap-2">
                      <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Personal Details
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => update("name", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => update("email", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Suburb / Town / City"
                        value={formData.location}
                        onChange={(e) => update("location", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    <select
                      required
                      value={formData.denomination}
                      onChange={(e) => update("denomination", e.target.value)}
                      className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream focus:border-wheat/40 focus:outline-none transition-colors rounded-xl appearance-none text-sm"
                    >
                      <option value="" className="bg-midnight text-cream/30">Your Faith Family</option>
                      <option value="catholic" className="bg-midnight">Catholic</option>
                      <option value="protestant" className="bg-midnight">Protestant</option>
                      <option value="jehovahs-witness" className="bg-midnight">Jehovah's Witness</option>
                      <option value="orthodox" className="bg-midnight">Orthodox</option>
                      <option value="anglican" className="bg-midnight">Anglican</option>
                      <option value="baptist" className="bg-midnight">Baptist</option>
                      <option value="methodist" className="bg-midnight">Methodist</option>
                      <option value="lutheran" className="bg-midnight">Lutheran</option>
                      <option value="presbyterian" className="bg-midnight">Presbyterian</option>
                      <option value="pentecostal" className="bg-midnight">Pentecostal</option>
                      <option value="other" className="bg-midnight">Other Bible-Believing</option>
                    </select>
                  </div>

                  {/* VERIFICATION */}
                  <div className="space-y-4 pt-4 border-t border-wheat/10">
                    <h4 className="text-xs tracking-[0.2em] uppercase text-wheat-light font-medium flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Verification Documents
                    </h4>

                    {/* WWCC */}
                    <div className="p-4 bg-wheat/5 rounded-xl border border-wheat/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-wheat-light" strokeWidth={1.5} />
                        <span className="text-sm text-cream/80 font-medium">Working With Children Check</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="WWCC Certificate Number"
                          value={formData.wwccNumber}
                          onChange={(e) => update("wwccNumber", e.target.value)}
                          className="w-full px-4 py-2.5 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                        />
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" strokeWidth={1.5} />
                          <input
                            type="date"
                            required
                            placeholder="Expiry Date"
                            value={formData.wwccExpiry}
                            onChange={(e) => update("wwccExpiry", e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" />
                          <div className="flex items-center gap-2 px-4 py-2 bg-midnight/40 border border-wheat/20 rounded-lg text-cream/50 hover:text-cream hover:border-wheat/40 transition-all text-sm group-hover:bg-midnight/60">
                            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Upload WWCC Certificate
                          </div>
                        </div>
                        <span className="text-xs text-cream/30">PDF or image</span>
                      </label>
                    </div>

                    {/* Police Check */}
                    <div className="p-4 bg-wheat/5 rounded-xl border border-wheat/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-wheat-light" strokeWidth={1.5} />
                        <span className="text-sm text-cream/80 font-medium">National Police Check</span>
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" strokeWidth={1.5} />
                        <input
                          type="date"
                          required
                          value={formData.policeCheckDate}
                          onChange={(e) => update("policeCheckDate", e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                        />
                      </div>
                      <p className="text-xs text-cream/30">Must be issued within the last 12 months.</p>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" />
                          <div className="flex items-center gap-2 px-4 py-2 bg-midnight/40 border border-wheat/20 rounded-lg text-cream/50 hover:text-cream hover:border-wheat/40 transition-all text-sm group-hover:bg-midnight/60">
                            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Upload Police Check
                          </div>
                        </div>
                        <span className="text-xs text-cream/30">PDF or image</span>
                      </label>
                    </div>

                    {/* First Aid */}
                    <div className="p-4 bg-wheat/5 rounded-xl border border-wheat/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <HeartPulse className="w-4 h-4 text-wheat-light" strokeWidth={1.5} />
                        <span className="text-sm text-cream/80 font-medium">First Aid Certificate</span>
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" strokeWidth={1.5} />
                        <input
                          type="date"
                          required
                          value={formData.firstAidExpiry}
                          onChange={(e) => update("firstAidExpiry", e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                        />
                      </div>
                      <p className="text-xs text-cream/30">HLTAID011 or equivalent. Must be current.</p>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png" />
                          <div className="flex items-center gap-2 px-4 py-2 bg-midnight/40 border border-wheat/20 rounded-lg text-cream/50 hover:text-cream hover:border-wheat/40 transition-all text-sm group-hover:bg-midnight/60">
                            <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                            Upload First Aid Certificate
                          </div>
                        </div>
                        <span className="text-xs text-cream/30">PDF or image</span>
                      </label>
                    </div>
                  </div>

                  {/* EMERGENCY CONTACT */}
                  <div className="space-y-4 pt-4 border-t border-wheat/10">
                    <h4 className="text-xs tracking-[0.2em] uppercase text-wheat-light font-medium flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Emergency Contact
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Emergency Contact Name"
                        value={formData.emergencyName}
                        onChange={(e) => update("emergencyName", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Emergency Contact Phone"
                        value={formData.emergencyPhone}
                        onChange={(e) => update("emergencyPhone", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* REFERENCE */}
                  <div className="space-y-4 pt-4 border-t border-wheat/10">
                    <h4 className="text-xs tracking-[0.2em] uppercase text-wheat-light font-medium flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Character Reference
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Reference Name (Pastor / Leader)"
                        value={formData.referenceName}
                        onChange={(e) => update("referenceName", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Reference Phone or Email"
                        value={formData.referenceContact}
                        onChange={(e) => update("referenceContact", e.target.value)}
                        className="w-full px-4 py-3 bg-midnight/60 border border-wheat/15 text-cream placeholder-cream/30 rounded-xl focus:border-wheat/40 focus:outline-none transition-colors text-sm"
                      />
                    </div>
                  </div>

                  {/* DECLARATIONS */}
                  <div className="space-y-4 pt-4 border-t border-wheat/10">
                    <h4 className="text-xs tracking-[0.2em] uppercase text-wheat-light font-medium flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Declarations
                    </h4>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.hasReadPolicy}
                        onChange={(e) => update("hasReadPolicy", e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-wheat/30 bg-midnight/60 text-wheat focus:ring-wheat/40"
                      />
                      <span className="text-sm text-cream/70 group-hover:text-cream/90 transition-colors">
                        I have read and understood the Meek Meet Safety Policy and Code of Conduct. 
                        I agree to uphold the safety, dignity, and wellbeing of every participant.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.documentsAccurate}
                        onChange={(e) => update("documentsAccurate", e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-wheat/30 bg-midnight/60 text-wheat focus:ring-wheat/40"
                      />
                      <span className="text-sm text-cream/70 group-hover:text-cream/90 transition-colors">
                        I confirm that all documents and information provided are true, accurate, 
                        and current. I understand that providing false information will result in 
                        permanent disqualification.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.understandsChecks}
                        onChange={(e) => update("understandsChecks", e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-wheat/30 bg-midnight/60 text-wheat focus:ring-wheat/40"
                      />
                      <span className="text-sm text-cream/70 group-hover:text-cream/90 transition-colors">
                        I understand that Meek Meet will verify my WWCC, police check, and first aid 
                        certificate directly with issuing authorities. I consent to this verification.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!allChecked}
                    className={`w-full flex items-center justify-center gap-3 px-8 py-4 font-medium tracking-wide text-sm rounded-full transition-all duration-300 shadow-lg ${
                      allChecked
                        ? "bg-wheat text-midnight hover:bg-wheat-light hover:shadow-xl"
                        : "bg-wheat/30 text-midnight/40 cursor-not-allowed"
                    }`}
                  >
                    <Send className="w-4 h-4" strokeWidth={1.5} />
                    Submit Application
                  </button>

                  <p className="text-xs text-cream/30 text-center leading-relaxed">
                    By submitting, you commit to shepherding your community with
                    gentleness and integrity. We review every application with prayer 
                    and thorough verification.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-wheat/10 rounded-2xl mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-wheat" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-2xl text-cream mb-3">
                    Application Received
                  </h3>
                  <p className="text-cream/50 max-w-sm mx-auto leading-relaxed mb-6">
                    Thank you for your willingness to serve. Our team will now verify 
                    your documents and contact your reference. We will be in touch within 
                    5 business days.
                  </p>
                  <p className="font-script text-xl text-wheat/40">
                    &ldquo;Well done, good and faithful servant.&rdquo;
                  </p>
                  <p className="text-xs text-cream/30 mt-1">— Matthew 25:23</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
