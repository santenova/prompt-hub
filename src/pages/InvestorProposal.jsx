import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from '../components/investors/StatCard';
import { TrendingUp, FileText, DollarSign, Users, Sparkles, Zap, Shield, Target, Globe, Cpu, Building, Briefcase, Rocket, Lightbulb, Link as LinkIcon, Download } from "lucide-react";
import { motion } from 'framer-motion';

const Section = ({ title, icon: Icon, children }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.5 }}>
    <Card className="shadow-lg overflow-hidden">
      <CardHeader className="bg-gray-50/50">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800">
          {Icon && <Icon className="w-6 h-6 text-purple-600" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  </motion.div>
);

export default function InvestorProposal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="text-center space-y-4 pt-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">only-agent.ai</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Privacy-First AI Marketplace Ecosystem
          </motion.p>
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="flex items-center justify-center gap-4">
            <Button variant="outline" asChild>
                <a href="#">Back to News</a>
            </Button>
            <Button asChild>
                <a href="#"> <Download className="w-4 h-4 mr-2" /> Download PDF</a>
            </Button>
           </motion.div>
        </header>

        <Section title="Executive Summary" icon={TrendingUp}>
          <p className="text-gray-700 leading-relaxed text-base">
            <b>only-agent.ai</b> is a revolutionary AI marketplace ecosystem designed for the era of data sovereignty and privacy-first computing. Unlike traditional cloud-based AI platforms, we serve multiple customer segments through a unified platform including a public marketplace, enterprise white-label solutions, and custom deployments. Our platform addresses a critical market gap for enterprises that are legally or strategically prohibited from using cloud-based AI, representing a €140B+ opportunity. We monetize through commissions, direct sales, licensing, and managed services, with a software-first model enabling high margins and minimal infrastructure costs.
          </p>
        </Section>
        
        <Section title="Investment Highlights" icon={Sparkles}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard title="TAM" value="€140B+" description="Total addressable market" color="border-purple-500"/>
                <StatCard title="Customer Segments" value="5+" description="Individuals, SMBs, enterprises, vendors..." color="border-indigo-500" />
                <StatCard title="Margin" value="70-90%" description="Software-first business model" color="border-blue-500" />
                <StatCard title="Strong Moat" value="First-Mover" description="Privacy-first AI marketplace ecosystem" color="border-sky-500" />
            </div>
        </Section>

        <Section title="Revenue Streams" icon={DollarSign}>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Marketplace Commission" value="0-20%" description="From third-party vendors" />
                <StatCard title="Direct Product Sales" value="€30K-300K" description="ARR from our own AI agents" />
                <StatCard title="Enterprise Licensing" value="€100K-1M" description="Per white-label client" />
                <StatCard title="Managed Hosting" value="€10K-100K" description="Optional MRR service" />
            </div>
             <CardDescription className="mb-4">Multi-Tier Commission Strategy</CardDescription>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Local Tier (0%)</TableHead>
                        <TableHead>Basic (10%)</TableHead>
                        <TableHead>Professional (15%)</TableHead>
                        <TableHead>Enterprise (20%)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Products on customer infrastructure. Drives adoption.</TableCell>
                        <TableCell>Standard marketplace listing.</TableCell>
                        <TableCell>Enhanced visibility and analytics.</TableCell>
                        <TableCell>Premium placement and co-marketing.</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Section>
        
        <Section title="Unique Market Advantages" icon={Zap}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdvantageCard icon={Shield} title="Data Sovereignty" description="Complete data privacy with local deployment. No third parties reading prompts." />
                <AdvantageCard icon={FileText} title="Regulatory Compliance" description="Perfect for companies bound by GDPR, industry regulations, or government restrictions." />
                <AdvantageCard icon={DollarSign} title="Zero Operational AI Costs" description="Use open-source models like Ollama, reducing AI spend by 90%+." />
                <AdvantageCard icon={Globe} title="Geopolitical Independence" description="No dependency on US tech giants or foreign governments." />
                <AdvantageCard icon={Cpu} title="Hybrid Architecture" description="Flexibility to mix local models with cloud APIs where appropriate." />
                <AdvantageCard icon={Rocket} title="Rapid Deployment" description="Clone-ready infrastructure to launch an AI marketplace in weeks." />
            </div>
        </Section>

        <Section title="Target Market Segments" icon={Target}>
            <div className="grid md:grid-cols-2 gap-6">
                <MarketSegment title="European Enterprises" marketSize="€50B+" painPoint="Restricted by GDPR and data sovereignty requirements." solution="Local deployment eliminates compliance concerns." />
                <MarketSegment title="Healthcare & Finance" marketSize="€30B+" painPoint="Cannot use cloud AI due to patient/client data sensitivity." solution="On-premise AI with complete data isolation." />
                <MarketSegment title="Government Agencies" marketSize="€20B+" painPoint="Prohibited from using foreign-owned AI services." solution="Sovereign AI infrastructure with no external dependencies." />
                <MarketSegment title="Manufacturing & Industrial" marketSize="€40B+" painPoint="High token costs make AI prohibitive." solution="Zero marginal cost with local open-source models." />
            </div>
        </Section>
        
        <Section title="Go-to-Market Strategy" icon={Rocket}>
            <div className="space-y-6">
              <Phase number="1" title="Foundation (Months 1-6)" description="Expand public marketplace, onboard vendors, establish presence at EU AI/privacy conferences, and secure pilot customers for white-label deployments." />
              <Phase number="2" title="Scale (Months 7-18)" description="Scale vendor ecosystem, close enterprise deals, partner with EU cloud providers (OVH, Hetzner), and launch managed hosting." />
              <Phase number="3" title="Dominance (Months 19-36)" description="Become the de facto privacy-first AI marketplace in Europe, expand to North America, and achieve significant ARR." />
            </div>
        </Section>

        <Section title="Current Development Progress" icon={Lightbulb}>
            <div className="space-y-4">
                <p className="text-center font-semibold text-lg text-gray-800">Real products, real traction, ready for scale.</p>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-bold text-green-800">Platform Status: Production Ready</p>
                    <ul className="list-disc list-inside text-sm text-green-700 mt-2 space-y-1">
                        <li>Multi-domain deployment architecture operational</li>
                        <li>Full Stripe payment integration with recurring subscription support</li>
                        <li>Marketplace infrastructure supporting agents, products & services</li>
                        <li>Development focus shifted from building to scaling and market preparation</li>
                    </ul>
                </div>
                
                <h4 className="font-semibold text-gray-800 pt-4">Active Product Portfolio:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <ProductCard title="Prompt-Hub" status="LIVE" link="https://prompt.only-agent.ai/" description="Professional prompt management platform for AI power users. Organize, version, and optimize your AI prompts." />
                    <ProductCard title="Marketplace Platform" status="SCALING" description="Core marketplace hosting multiple AI agents and services with integrated payments, user management, and analytics." />
                </div>
            </div>
        </Section>

      </div>
    </div>
  );
}

const AdvantageCard = ({ icon: Icon, title, description }) => (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Icon className="w-7 h-7 text-indigo-600 mb-3" />
        <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </div>
);

const MarketSegment = ({ title, marketSize, painPoint, solution }) => (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
        <p className="text-sm font-bold text-purple-600 mb-2">{marketSize}</p>
        <p className="text-sm text-gray-600"><strong className="text-gray-800">Pain Point:</strong> {painPoint}</p>
        <p className="text-sm text-green-700"><strong className="text-green-800">Solution:</strong> {solution}</p>
    </div>
);

const Phase = ({ number, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg">{number}</div>
        <div>
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-600">{description}</p>
        </div>
    </div>
);

const ProductCard = ({ title, status, description, link }) => (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">{title}</h4>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status === 'LIVE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{status}</span>
        </div>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline flex items-center gap-1">Visit <LinkIcon className="w-3 h-3" /></a>}
    </div>
);