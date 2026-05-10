
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Users, 
  Briefcase, 
  Mail, 
  TrendingUp,
  Copy,
  Download,
  Sparkles,
  User,
  BookOpen,
  MessageSquare,
  Code,
  ShoppingCart,
  Heart,
  Megaphone,
  Video,
  ArrowRight,
  Star,
  Zap,
  Target,
  CheckCircle2
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { apiClient } from '@/apis/client';

const exampleContent = [
  {
    id: 1,
    title: "Technical Blog Post for Software Engineers",
    persona: {
      name: "Software Engineer",
      icon: "💻",
      description: "Writing for technical audiences about React performance optimization"
    },
    template: "Blog Post Writer",
    category: "Technical Writing",
    scenario: "A Software Engineer sharing insights on React performance",
    content: {
      headline: "5 React Performance Optimizations That Cut Load Time by 40%",
      introduction: "You're staring at your React app's performance metrics, and they're not pretty. Your users are complaining about slow load times, and you know something needs to change.\n\nIf you've ever watched your beautifully crafted React application crawl under production load, you're not alone. According to recent studies, 53% of mobile users abandon sites that take longer than 3 seconds to load.\n\nIn this post, you'll discover five battle-tested optimization techniques that helped me reduce our app's load time from 8.2 seconds to 4.9 seconds—a 40% improvement that directly impacted our conversion rates. By the end, you'll have a clear roadmap for making your React app lightning-fast.",
      mainPoints: [
        {
          heading: "1. Implement Code Splitting with React.lazy()",
          content: "Code splitting is your first line of defense against bloated bundle sizes. Instead of loading your entire application upfront, React.lazy() allows you to load components on-demand.\n\nHere's the impact: Our initial bundle size dropped from 2.8MB to 890KB—a 68% reduction—by lazy loading routes and heavy components.\n\nImplementation:\n```javascript\nconst Dashboard = React.lazy(() => import('./Dashboard'));\nconst Analytics = React.lazy(() => import('./Analytics'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<LoadingSpinner />}>\n      <Routes>\n        <Route path=\"/dashboard\" element={<Dashboard />} />\n        <Route path=\"/analytics\" element={<Analytics />} />\n      </Routes>\n    </Suspense>\n  );\n}\n```\n\nPro tip: Start with route-level splitting, then identify heavy components within those routes for further optimization."
        },
        {
          heading: "2. Memoize Expensive Computations with useMemo",
          content: "React's useMemo hook prevents unnecessary recalculations by caching computed values between renders.\n\nWe had a data grid component that was recalculating filtered and sorted results on every render—even when the underlying data hadn't changed. After implementing useMemo, render time for that component dropped from 340ms to 12ms.\n\nExample:\n```javascript\nconst expensiveCalculation = useMemo(() => {\n  return data\n    .filter(item => item.status === 'active')\n    .sort((a, b) => b.value - a.value)\n    .slice(0, 100);\n}, [data]); // Only recalculate when data changes\n```"
        },
        {
          heading: "3. Virtualize Long Lists with react-window",
          content: "Rendering thousands of DOM elements kills performance. List virtualization only renders what's visible in the viewport.\n\nOur customer list was rendering 5,000+ rows at once. After implementing react-window, memory usage dropped by 73%, and scrolling became buttery smooth.\n\nBefore: 2.3GB memory, janky scrolling\nAfter: 620MB memory, 60fps smooth scrolling"
        }
      ],
      conclusion: "These five optimizations transformed our React application from sluggish to snappy. Start with code splitting—it offers the biggest immediate impact with minimal effort. Then profile your app to identify which of the other techniques will give you the most bang for your buck.\n\nRemember: premature optimization is the root of all evil, but informed optimization is the path to happy users.",
      cta: "Want to dive deeper? Check out my complete React Performance Toolkit on GitHub, including ready-to-use hooks and components for all five optimizations.",
      stats: {
        readTime: "8 min read",
        wordCount: "1,847 words",
        targetAudience: "Mid to Senior React Developers"
      }
    }
  },
  {
    id: 2,
    title: "HR Job Posting for Tech Startup",
    persona: {
      name: "HR Professional",
      icon: "👔",
      description: "Crafting an engaging job posting for a startup culture"
    },
    template: "Job Posting",
    category: "HR & Recruitment",
    scenario: "HR professional creating a job post that attracts top talent",
    content: {
      title: "Senior Frontend Developer - Help Us Build the Future of Remote Work",
      company: "FlowSpace (YC W23) - Remote-First Collaboration Platform",
      location: "Remote (US & Canada) | $140k-$180k + equity",
      opening: "Remember the last time you joined a Zoom call and thought, 'there has to be a better way'? We did too. That's why we built FlowSpace.\n\nWe're a 30-person startup backed by Y Combinator, revolutionizing how distributed teams collaborate. Our platform is used by 500+ companies including teams at Stripe, Notion, and Figma. And we're just getting started.",
      role: "As our Senior Frontend Developer, you'll:\n• Own key features of our React-based collaboration platform\n• Work directly with our founders to shape product direction  \n• Mentor junior developers and establish engineering best practices\n• Ship code that impacts thousands of users daily\n• Help scale our frontend architecture as we grow 10x",
      requirements: "What You Bring:\n• 5+ years building production React applications\n• Deep understanding of modern frontend architecture (we use Next.js, TypeScript, Tailwind)\n• Experience with real-time features (WebSockets, WebRTC)\n• Track record of mentoring and leading technical initiatives\n• Genuine excitement about remote work and async collaboration\n\nBonus Points:\n• You've built collaborative tools or multiplayer experiences\n• Open source contributions\n• Experience at early-stage startups\n• Strong design sensibility",
      offer: "What We Offer:\n💰 Competitive salary ($140k-$180k) + meaningful equity (0.25%-0.5%)\n🏠 Fully remote with $3k home office stipend\n🏥 Platinum health, dental, vision for you and family\n📚 $2k/year learning & development budget\n🌴 Unlimited PTO (we actually mean it - 4 week minimum)\n🚀 Work with cutting-edge tech stack\n🎯 Direct impact on product and company direction\n🌍 Annual team retreats (last one was in Tulum!)",
      culture: "Our Values:\n• Async-first, meeting-optional\n• Default to transparency\n• Ship fast, iterate faster\n• Trust over surveillance\n• Results over hours logged",
      process: "Interview Process:\n1. 30-min intro call with our Head of Engineering\n2. Take-home project (3-4 hours, we pay $200 for your time)\n3. Technical deep-dive with the team (90 mins)\n4. Culture fit chat with founders (30 mins)\n5. Reference checks + offer\n\nTimeline: 1-2 weeks start to finish. We move fast.",
      cta: "Ready to Build Something Amazing?\nApply with your resume, GitHub, and a few sentences about why you're excited about FlowSpace. We review every application personally.\n\nQuestions? Email our CTO directly: alex@flowspace.io",
      ps: "P.S. Don't have every qualification? Apply anyway. We value potential and passion over perfect resumes."
    }
  },
  {
    id: 3,
    title: "Email Newsletter for Social Media Manager",
    persona: {
      name: "Social Media Manager",
      icon: "📱",
      description: "Creating a weekly social media tips newsletter"
    },
    template: "Email Newsletter",
    category: "Email Marketing",
    scenario: "Weekly newsletter with social media trends and tips",
    content: {
      subject: "🔥 Instagram's Algorithm Changed Again (Here's What to Do)",
      preview: "Plus: LinkedIn carousel hack going viral & TikTok's new feature",
      header: "Social Media Weekly | Edition #47 | Dec 3, 2024",
      greeting: "Hey there, social media rockstar! 👋\n\nWelcome back to Social Media Weekly, where we cut through the noise and deliver actionable insights you can use TODAY.\n\nThis week: Instagram dropped a bombshell algorithm update, and everyone's freaking out. But don't worry—I've got you covered with the exact playbook that's working right now.",
      featured: {
        headline: "🚨 Instagram's December Algorithm Update: What Changed & What to Do",
        summary: "Instagram confirmed they're prioritizing 'original content' and penalizing reposted memes. Accounts that solely share others' content saw reach drop by 30-60% overnight.\n\nHere's what's working:\n• Original photos/videos (even phone quality) > polished reposts\n• Stories with engagement stickers getting 3x more reach\n• Reels under 30 seconds performing 40% better\n• Carousel posts seeing resurgence (finally!)\n\nFull breakdown + examples inside →"
      },
      sections: [
        {
          title: "📈 What's Working Now",
          items: [
            {
              title: "LinkedIn Carousel Hack Going Viral",
              description: "A simple template is getting 10x engagement: 'Things I Wish I Knew at 25' format. Easy to replicate for any industry.",
              link: "See examples →"
            },
            {
              title: "TikTok's 'Whispering' Trend",
              description: "ASMR-style content is exploding. Even B2B brands are jumping in. Yes, really.",
              link: "Watch →"
            }
          ]
        },
        {
          title: "🛠️ Tools We're Loving",
          resource: "**Taplio 2.0** just launched, and it's a game-changer for LinkedIn scheduling. AI writes your posts, suggests best times, and auto-engages with your network. We tested it for a week and doubled our impressions.\n\nSpecial offer: Get 20% off with code SMWEEKLY"
        },
        {
          title: "💬 Community Spotlight",
          story: "Shoutout to subscriber @MarketingMaven who used last week's Reels template and hit 100k views! Her secret? Adding captions manually instead of auto-captions. Algorithm loves it."
        },
        {
          title: "🔥 This Week's Stats",
          trending: [
            "📊 Average engagement rate dropped 12% across all platforms (yes, organic reach is dying)",
            "🎥 Short-form video still king: 67% of content going viral is under 60 seconds",
            "⭐ User-generated content converting 4.5x better than branded content"
          ]
        }
      ],
      poll: "**Quick Poll:** Which platform are you focusing on most in 2024?\nVote: Instagram | TikTok | LinkedIn | X/Twitter",
      cta: "🚀 Ready to Level Up?\nJoin our Premium Membership for:\n• Daily algorithm updates\n• Done-for-you content templates\n• Private community\n• Monthly strategy calls\n\nLimited to 100 members. 23 spots left.\n[Join Now - 50% Off This Week]",
      footer: "Until next week, keep creating!\n\n— Sarah Chen\nFounder, Social Media Weekly\n\nP.S. Seen a trend we should cover? Hit reply—I read every email! 💌"
    }
  },
  {
    id: 4,
    title: "Brand Story for Craft Beer Enthusiast Audience",
    persona: {
      name: "Craft Beer Enthusiast",
      icon: "🍺",
      description: "Writing a brand origin story that resonates with beer lovers"
    },
    template: "Brand Story",
    category: "Brand Marketing",
    scenario: "Craft brewery's founding story for their 'About Us' page",
    content: {
      title: "From Homebrew Disasters to Award-Winning Ales",
      origin: "**The Problem**\n\nEvery craft beer tasted the same. IPA. More hops. Even more hops. Repeat.\n\nIn 2019, best friends Mike and Alex sat in yet another trendy brewery, drinking yet another hop-bombed IPA, and wondered: When did craft beer become so... predictable?\n\nThey'd been homebrewing together for 7 years—in Mike's garage, at 2am, often with questionable results. (RIP Batch #23, you were too weird for this world.) But they'd also created some magic: a Belgian-style wit with lavender, a porter with cold-brew coffee, a sour aged in wine barrels from Alex's uncle's vineyard.\n\nThese weren't beers you could find at any taproom. They were experiments. Conversations starters. Beers with stories.",
      spark: "**The Spark**\n\n\"What if we just... made what we wanted to drink?\"\n\nSimple question. Terrifying answer: quit their jobs (Mike was a software engineer, Alex a high school teacher), max out credit cards, and turn the garage experiments into a real brewery.\n\nTheir families thought they were insane. They were probably right.",
      journey: "**The Journey**\n\nYear 1: Renovated an old mechanic's shop in East Austin. Learned that 'restaurant-grade plumbing' costs way more than Google said. Batch #1 of our flagship Cosmic Wit sold out in 3 hours at our soft opening. Cried. Made more.\n\nYear 2: Won 'Best New Brewery' at GABF (still pinching ourselves). Expanded from 3 to 8 taps. Hired our first employees: Sarah (head brewer who forgot more about yeast than we'll ever know) and Marcus (bartender who could explain our weirdest beers to anyone).\n\nYear 3: COVID almost killed us. Pivoted to cans, home delivery, and virtual tastings. Our 'Quarantine Sour' series became our best-selling line. Sometimes chaos creates opportunity.",
      purpose: "**Why We Brew**\n\nWe're not here to make the hoppiest IPA or win the most medals (though we won't turn them down).\n\nWe're here to make beers that make you pause, taste something unexpected, and say, 'Huh, that's interesting.' Beers that pair with adventures, conversations, and moments worth remembering.\n\nEvery batch tells a story. Every pour starts a conversation.\n\nBecause beer should be interesting, not just drinkable.",
      values: [
        "**Experiment Boldly**: If a beer idea makes us nervous, we're probably onto something.",
        "**Stay Local**: Our ingredients come from Texas farmers, our barrels from local distilleries, our inspiration from this weird, wonderful city.",
        "**No Gatekeeping**: Whether you're a beer nerd or just curious, you're welcome here. We'll talk hops or we'll talk football. All good."
      ],
      transformation: "**How We Help Beer Lovers**\n\nWe give you beers you can't find anywhere else. Seasonal rotations that actually rotate. Collaborations with local roasters, meaderies, distilleries.\n\nYou don't just drink our beer—you join experiments. Our 'Brewer's Choice' members vote on new recipes. Our taproom hosts homebrew workshops. We've created a community of people who believe beer should be an adventure.",
      future: "**Where We're Going**\n\nNew 15-barrel system installing next month. Expanding to a second location in 2025. Canning more weird stuff.\n\nBut some things won't change: We'll still brew what excites us, not what algorithms or trends tell us to. We'll still hang out in the taproom, talking shop with whoever wants to talk.\n\nCome be weird with us.\n\n*Forager Brewing Co. — Austin, Texas since 2019*"
    }
  },
  {
    id: 5,
    title: "Fundraising Appeal from Nonprofit Perspective",
    persona: {
      name: "Nonprofit Professional",
      icon: "❤️",
      description: "Writing an urgent year-end fundraising appeal"
    },
    template: "Fundraising Appeal Letter",
    category: "Nonprofit",
    scenario: "Year-end campaign for an education nonprofit",
    content: {
      subject: "Maria's homework is late again. Here's why.",
      opening: "Dear Friend,\n\nEleven-year-old Maria sits in the public library parking lot at 9 PM, hunched over her laptop in the back seat of her mom's car. The WiFi reaches just far enough. Her homework is due at midnight.\n\nShe's not the only one. On any given night, 15-20 kids in our community do homework in parking lots because they don't have internet at home.\n\nIn 2024. In America. This is the reality for 1 in 3 students in our county.",
      problem: "The digital divide isn't just about internet access. It's about falling behind in every subject. It's about missing virtual tutoring sessions. It's about feeling ashamed when teachers assign online projects.\n\nLast year, we tracked 200 students without reliable internet. By June, 78% were behind grade level in math. 64% in reading. The correlation is devastating.",
      solution: "That's why ConnectED Community exists.\n\nFor 6 years, we've been bridging the digital divide by:\n• Installing free WiFi hotspots in underserved neighborhoods  \n• Providing laptops to students who need them\n• Offering free tech support and digital literacy classes\n• Creating homework help centers with reliable internet\n\nLast year, we served 847 students. Students like Maria.",
      impact: "Here's what happened after Maria got her laptop and WiFi hotspot from ConnectED:\n\n• Her grades went from C's and D's to A's and B's\n• She discovered coding through our free courses\n• She now tutors other kids in her building\n• She's talking about becoming a software engineer\n\nHer mom told me, crying: 'You gave my daughter a future.'\n\nThat's not our work. That's YOUR work. Donors like you make stories like Maria's possible.",
      ask: "This holiday season, I'm asking you to invest in more stories like Maria's.\n\n**Your gift provides:**\n• $50: One month of internet for a family\n• $150: Refurbished laptop for a student\n• $500: Homework help center supplies for a semester\n• $1,000: Full year of internet + laptop + support\n\nEvery dollar you give will be DOUBLED thanks to a generous matching grant from the Austin Technology Foundation. Your $100 becomes $200. Your $500 becomes $1,000.\n\nBut this match expires December 31st.",
      urgency: "Right now, we have 143 students on our waiting list. Kids doing homework in parking lots. Kids falling further behind every day.\n\nWith your help, we can reach every single one before the new semester starts in January.",
      howToGive: "**Make Your Matched Gift Today:**\n\n🌐 Online: www.connectedcommunity.org/give\n📞 Phone: (512) 555-0123  \n📮 Mail: [Reply envelope enclosed]\n\nYour gift is 100% tax-deductible. Tax ID: 12-3456789",
      closing: "Imagine if Maria had given up. If she'd decided school wasn't for her because she couldn't complete her homework.\n\nNow imagine 143 more kids getting the same chance she did.\n\nThat's what your gift makes possible.\n\nThank you for believing that every child deserves access to education—no matter where they live or their family's income.\n\nWith deep gratitude,\n\n**Jennifer Rodriguez**  \nExecutive Director  \nConnectED Community\n\nP.S. Your gift before December 31st will be DOUBLED. A $100 gift helps two students. Please don't wait—these kids are counting on us."
    }
  },
  {
    id: 6,
    title: "E-commerce Product Description for Fashion Brand",
    persona: {
      name: "E-commerce Manager",
      icon: "🛍️",
      description: "Writing compelling product descriptions that drive sales"
    },
    template: "Product Description",
    category: "E-commerce",
    scenario: "Product page for premium sustainable fashion brand",
    content: {
      productName: "The Essential Linen Shirt",
      tagline: "Effortlessly elegant. Ridiculously comfortable. Actually sustainable.",
      hero: "Some shirts you wear. This one you live in.\n\nWe spent two years perfecting the fit, fabric, and feel of this linen shirt. The result? A wardrobe staple that looks just as good at brunch as it does at the office, and feels like your favorite weekend tee.",
      features: [
        {
          title: "100% European Linen",
          description: "Sourced from flax fields in Belgium where it's been grown for centuries. No pesticides, no synthetic fertilizers—just sun, rain, and time. The fabric gets softer and better with every wash."
        },
        {
          title: "The Perfect Fit",
          description: "Not too boxy, not too slim. Tailored through the shoulders and chest with a slightly relaxed body. Sleeves hit just past the elbow when rolled—which you'll do, because they stay put. Available in Regular and Tall."
        },
        {
          title: "Details That Matter",
          description: "Mother-of-pearl buttons (they don't crack like plastic). Double-stitched seams. Reinforced collar that holds its shape. Hidden button at the collar for when you want to lose the tie. A back pleat for movement."
        },
        {
          title: "Climate Positive",
          description: "This shirt removes more CO₂ from the atmosphere than it creates. For every one sold, we fund reforestation projects that offset 10x the carbon footprint of production and shipping."
        }
      ],
      sizing: "**Fit Guide:**\nTrue to size with a modern relaxed fit.\n• Chest: measured 2\" below armhole\n• Length: from high point shoulder to hem\n• Model is 6'1\", 180lbs wearing size M\n\nSize S: Chest 40\" / Length 29\"\nSize M: Chest 42\" / Length 30\"\nSize L: Chest 44\" / Length 31\"\nSize XL: Chest 46\" / Length 32\"",
      care: "**Easy Care:**\n• Machine wash cold, tumble dry low\n• Gets softer with each wash\n• Iron while damp if you must (we don't)\n• Expect natural wrinkles—they're part of linen's charm",
      sustainability: "**Made Right:**\n• 100% natural, biodegradable fibers\n• Requires 5x less water than cotton\n• Sewn in a Fair Trade Certified factory in Portugal\n• Packaged in compostable materials\n• Carbon-neutral shipping\n• 365-day wear-it-out guarantee",
      reviews: {
        rating: 4.9,
        count: 847,
        highlights: [
          "\"Best shirt I've ever owned. Bought 3 more.\" - James K.",
          "\"Finally, a white linen shirt that isn't see-through!\" - Sarah L.",
          "\"The fit is perfection. Feels expensive, priced fairly.\" - Marcus R."
        ]
      },
      price: "$89",
      comparePrice: "$145 typical retail",
      cta: "**Choose Your Color:**\n□ Natural White  □ Ocean Blue  □ Stone Gray  □ Olive Green\n\nAdd to Cart — Free Shipping Over $100\n\n✓ 30-day free returns\n✓ 365-day guarantee\n✓ Ships within 24 hours"
    }
  },
  {
    id: 7,
    title: "Video Script for YouTube Education Channel",
    persona: {
      name: "Content Creator",
      icon: "🎬",
      description: "Creating engaging educational video scripts"
    },
    template: "Video Script",
    category: "Video Content",
    scenario: "10-minute educational video about personal finance",
    content: {
      title: "I Tracked Every Dollar for 90 Days. Here's What I Learned.",
      hook: "[VISUAL: Phone screen showing expense tracking app]\n\nVOICEOVER: $4,347.82.\n\nThat's how much money I couldn't account for over the past 90 days. Not stolen. Not lost. Just... gone.\n\n[JUMP CUT to presenter]\n\nIf you're like most people, you have no idea where your money actually goes. Sure, you know about rent and your car payment. But what about everything else?\n\nI decided to track every single purchase for 90 days—every coffee, every Amazon impulse buy, every dollar. What I discovered shocked me.\n\n[TITLE CARD: I TRACKED EVERY DOLLAR FOR 90 DAYS]",
      intro: "[Presenter on camera]\n\nHey, I'm Alex, and three months ago, I had a mini existential crisis.\n\nI make decent money. I'm not living paycheck to paycheck. But somehow, I'm not saving as much as I should be. My 'savings account' felt more like a suggestion than an actual account.\n\nSo I did what any rational person would do—I went full spreadsheet nerd and tracked every purchase for 90 days.\n\nToday, I'm sharing the five most shocking discoveries, and more importantly, the simple changes that helped me save an extra $847 a month without feeling deprived.\n\nLet's do this.",
      sections: [
        {
          title: "Discovery #1: The Small Stuff Adds Up (Duh, But Seriously)",
          content: "[VISUAL: Animated chart showing small purchases]\n\nOkay, everyone says this. But actually seeing the numbers hit different.\n\n$4.50 coffee × 5 days a week = $22.50/week = $97.50/month = $1,170/year\n\nMultiply that by all the 'small' things—snacks, drinks, delivery fees, parking—and I was spending $427/month on stuff I barely remembered buying.\n\n[ON SCREEN: $427/month = $5,124/year]\n\nThat's a decent vacation. Or three months of rent. Or a serious dent in student loans.\n\nThe fix? I didn't cut everything. Instead, I picked my three favorite 'small luxuries' and automated them:\n• Friday morning coffee from my favorite cafe\n• Weekly sushi with friends\n• Monthly cocktail bar visit\n\nEverything else? Made at home or skipped. Saved $311/month just from this."
        },
        {
          title: "Discovery #2: Subscriptions Are Vampires",
          content: "[VISUAL: Screenshot of banking app with subscriptions highlighted]\n\nI found ELEVEN subscriptions I'd forgotten about.\n\nEleven.\n\nNetflix (okay, using it). Spotify (using it). But also:\n• A meditation app I used twice in 2022\n• A gym membership I haven't visited since March\n• Two 'free trials' that I never canceled\n• A premium tier of some app I don't even recognize\n\nTotal: $147/month on subscriptions I wasn't using.\n\n[ACTION STEP ON SCREEN]\n\nDo this right now: Check your bank statements for the last month. Look for anything labeled 'subscription' or 'membership.' Cancel anything you don't actively use.\n\nI'll wait.\n\nSeriously, pause the video and do it. It'll take 10 minutes and save you over $1,000 this year."
        },
        {
          title: "Discovery #3: Weekends Destroy Budgets",
          content: "[VISUAL: Bar graph comparing weekday vs weekend spending]\n\nMonday-Thursday? Averaged $31/day.\nFriday-Sunday? Averaged $97/day.\n\nWeekends accounted for only 29% of the week but 45% of my variable spending.\n\nWhy? Social pressure. FOMO. The 'I deserve it, I worked hard' mentality.\n\nI'm not saying become a hermit. But being aware helped me:\n• Suggest cheaper hangout ideas (game night instead of expensive dinners)\n• Pre-plan one 'splurge' activity instead of multiple spontaneous ones\n• Meal prep Sunday brunches instead of $45 bottomless mimosa situations\n\nResult: Cut weekend spending by 40% while actually having MORE fun because plans were intentional."
        },
        {
          title: "Discovery #4: Convenience Costs More Than You Think",
          content: "[VISUAL: Delivery app receipts side by side with grocery receipts]\n\nDelivery apps are convenient. They're also expensive.\n\nA $12 meal becomes $23 after fees, tips, and upcharges.\n\nOver 90 days:\n• Restaurant delivery: $1,243\n• Grocery delivery: $387\n• Total convenience tax: $412 just in fees\n\nSwitched to:\n• Meal prep Sundays (saves time during the week too)\n• Pickup instead of delivery (saves $8-15 per order)\n• Batch grocery shopping every 10 days\n\nSaved $289/month. Stress levels actually went DOWN because less decision fatigue."
        },
        {
          title: "Discovery #5: You Can't Out-Earn Bad Habits",
          content: "[Presenter serious, looking at camera]\n\nThis was the hardest lesson.\n\nI kept thinking, 'If I just make more money, I won't have to worry about this stuff.'\n\nBut here's the thing: At the beginning of tracking, I got a $500 freelance payment. By the end of the month, that $500 was gone. No idea where.\n\nMore money doesn't fix poor spending awareness. It just means you spend more unconsciously.\n\nThe real breakthrough wasn't cutting spending—it was becoming AWARE of spending.\n\nNow before any purchase over $30, I ask:\n• Do I need this, or do I just want it right now?\n• Will I still care about this in a week?\n• What am I actually buying? (Sometimes that $60 gadget is really buying 'feeling productive' without actually being productive)\n\nThis simple pause saved me from dozens of impulse purchases."
        }
      ],
      results: "[VISUAL: Before/After comparison]\n\n**The Results:**\n\nBefore tracking: Saved maybe $200/month (if I was lucky)\nAfter tracking: Saving $1,047/month consistently\n\nThat's an extra $12,564 per year.\n\nBut more importantly? I don't feel deprived. I'm spending money on things I actually care about instead of mindlessly consuming.\n\nMy 'savings account' is now actually an account with savings in it.",
      actionSteps: "[ON SCREEN: Action checklist]\n\n**Your 90-Day Challenge:**\n\n1. Download a tracking app (I use YNAB, but even a simple spreadsheet works)\n2. Track EVERY purchase for at least 30 days\n3. Review weekly—look for patterns, not perfection\n4. Pick one category to optimize\n5. Automate your savings FIRST (pay yourself before everyone else)\n\nDon't try to fix everything at once. Start with awareness. The changes come naturally once you see the numbers.\n\n[CALL TO ACTION]\n\nDrop a comment: What's one spending habit you KNOW you should track? And subscribe if you want more real-talk personal finance content without the gatekeeping.\n\nSee you next week. Go track some dollars. 💰",
      outro: "[VISUAL: Channel end screen with related videos]\n\n✓ Subscribe for weekly money tips\n✓ Watch next: 'How I Paid Off $30K in Debt'\n✓ Follow on Instagram @financewithAlex"
    }
  },
  {
    id: 8,
    title: "Sales Landing Page for SaaS Product",
    persona: {
      name: "Marketing Manager",
      icon: "📊",
      description: "Creating high-converting landing page copy"
    },
    template: "Landing Page Copy",
    category: "Sales & Marketing",
    scenario: "Launch page for project management SaaS tool",
    content: {
      headline: "Stop Managing Projects. Start Shipping Them.",
      subheadline: "The project management tool your team will actually use. No training required.",
      hero: "Most project management tools are built for project managers.\n\nFlowTrack is built for makers—designers, developers, and doers who need to ship, not administrate.\n\nSimple enough to start in 5 minutes. Powerful enough to scale with you.",
      problem: {
        title: "Sound Familiar?",
        points: [
          "Your team ignores the fancy PM tool because it's 'too complicated'",
          "You spend more time updating tasks than actually working on them",
          "Projects live in Slack threads, spreadsheets, and someone's head",
          "You have no idea if you're on track until it's too late",
          "Every tool requires a 2-hour training session and a certification course"
        ]
      },
      solution: {
        title: "There's a Better Way",
        description: "FlowTrack combines the simplicity of a kanban board with the power of a real project management system—without the complexity that makes your team groan.",
        features: [
          {
            icon: "⚡",
            title: "Instant Onboarding",
            description: "If you can drag and drop, you can use FlowTrack. No training sessions, no 45-page user manual. Your team is productive from day one."
          },
          {
            icon: "🎯",
            title: "Smart Automation",
            description: "Tasks automatically move through your workflow. Dependencies update themselves. Notifications actually matter because there aren't 500 of them."
          },
          {
            icon: "📊",
            title: "Real-Time Insights",
            description: "See exactly where every project stands. Spot bottlenecks before they become disasters. No manual status reports required."
          },
          {
            icon: "🔗",
            title: "Integrates With Everything",
            description: "GitHub, Figma, Slack, email—FlowTrack connects to your existing tools instead of trying to replace them."
          }
        ]
      },
      socialProof: {
        title: "Trusted by teams at:",
        companies: ["Stripe", "Notion", "Vercel", "Linear", "Figma", "Framer"],
        testimonials: [
          {
            quote: "We tried Asana, Monday, ClickUp... nothing stuck. FlowTrack is the first tool our entire team actually uses.",
            author: "Sarah Chen",
            role: "VP Product, TechCorp",
            image: "👩‍💼"
          },
          {
            quote: "Cut our project delivery time by 40% just by switching to FlowTrack. The visibility alone was worth it.",
            author: "Marcus Johnson",
            role: "Engineering Lead, StartupXYZ",
            image: "👨‍💻"
          },
          {
            quote: "Finally, a PM tool that doesn't feel like homework. My designers love it.",
            author: "Alex Rivera",
            role: "Creative Director, DesignStudio",
            image: "🎨"
          }
        ]
      },
      pricing: {
        title: "Simple, Honest Pricing",
        description: "No hidden fees. No 'contact sales' nonsense. Cancel anytime.",
        plans: [
          {
            name: "Starter",
            price: "$12/user/month",
            description: "Perfect for small teams getting started",
            features: [
              "Up to 10 team members",
              "Unlimited projects",
              "All core features",
              "Email support",
              "14-day free trial"
            ],
            cta: "Start Free Trial"
          },
          {
            name: "Professional",
            price: "$24/user/month",
            price_annually: "$19/user/month",
            badge: "Most Popular",
            description: "For growing teams who ship fast",
            features: [
              "Unlimited team members",
              "Advanced automation",
              "Custom workflows",
              "Priority support",
              "Advanced analytics",
              "API access"
            ],
            cta: "Start Free Trial"
          },
          {
            name: "Enterprise",
            price: "Custom",
            description: "For organizations with specific needs",
            features: [
              "Everything in Professional",
              "SSO & advanced security",
              "Dedicated account manager",
              "Custom integrations",
              "SLA guarantee",
              "Onboarding & training"
            ],
            cta: "Contact Sales"
          }
        ]
      },
      faq: [
        {
          question: "Do I need a credit card for the free trial?",
          answer: "Nope. Start your 14-day trial with just an email. No credit card required. We're confident you'll love it enough to stick around."
        },
        {
          question: "How long does it take to set up?",
          answer: "Most teams are up and running in under 10 minutes. Create a project, invite your team, start adding tasks. That's it."
        },
        {
          question: "Can I import data from other tools?",
          answer: "Yes! We have one-click importers for Asana, Trello, Monday.com, and CSV. Takes about 5 minutes to bring everything over."
        },
        {
          question: "What if my team hates it?",
          answer: "We'd be shocked, but if FlowTrack isn't right for you, cancel anytime during the trial. No questions, no hard feelings."
        }
      ],
      cta: {
        title: "Ready to Ship Faster?",
        description: "Join 5,000+ teams who've ditched complex PM tools for FlowTrack.",
        button: "Start Free 14-Day Trial",
        subtext: "No credit card required • Set up in 5 minutes • Cancel anytime",
        urgency: "🔥 50 teams signed up in the last 24 hours"
      }
    }
  }
];

export default function ContentExamples() {
  const [selectedExample, setSelectedExample] = useState(exampleContent[0]);
  const [copiedId, setCopiedId] = useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadContent = (content, title) => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(content, null, 2)], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Hero for Non-Authenticated Users */}
        {!currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white rounded-3xl p-8 sm:p-12 mb-12 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">Real AI-Generated Content</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                See What AI Can Create For You
              </h1>
              <p className="text-xl sm:text-2xl text-purple-100 max-w-3xl mx-auto mb-8">
                Professional content across 8 industries - all generated with our AI personas and templates in minutes
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-2xl"
                  onClick={() => apiClient.auth.redirectToLogin()}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Content Like This
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                  onClick={() => {
                    const examples = document.getElementById('examples-grid');
                    examples?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Explore Examples
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-purple-100">
                <span>✨ 8 Professional Examples</span>
                <span>•</span>
                <span>🚀 No Credit Card</span>
                <span>•</span>
                <span>⚡ Free Forever Plan</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Header for Logged-In Users */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI-Generated Content Examples</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              See It In Action
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Real-world examples of professional content created using our AI personas and templates
            </p>
          </motion.div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: "8 Examples", value: "8+", color: "purple" },
            { icon: Users, label: "8 Personas", value: "8", color: "blue" },
            { icon: Briefcase, label: "7 Industries", value: "7", color: "indigo" },
            { icon: Star, label: "Pro Quality", value: "100%", color: "pink" }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`bg-${stat.color}-50 border-${stat.color}-200`}>
                <CardContent className="pt-6 text-center">
                  <stat.icon className={`w-8 h-8 mx-auto mb-2 text-${stat.color}-600`} />
                  <p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Example Selection Grid */}
        <div id="examples-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {exampleContent.map((example, idx) => (
            <motion.div
              key={example.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-all h-full ${
                  selectedExample.id === example.id
                    ? 'border-2 border-purple-500 shadow-xl scale-105'
                    : 'hover:border-purple-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedExample(example)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl">{example.persona.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-sm leading-tight">{example.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {example.scenario}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      <User className="w-3 h-3 mr-1" />
                      {example.persona.name}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {example.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Selected Example Display */}
        <motion.div
          key={selectedExample.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2 border-purple-200 bg-white shadow-xl">
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-4xl">{selectedExample.persona.icon}</div>
                    <div>
                      <CardTitle className="text-2xl">{selectedExample.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedExample.scenario}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-600">
                      <User className="w-3 h-3 mr-1" />
                      {selectedExample.persona.name}
                    </Badge>
                    <Badge className="bg-indigo-600">
                      <FileText className="w-3 h-3 mr-1" />
                      {selectedExample.template}
                    </Badge>
                    <Badge variant="outline">
                      {selectedExample.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(JSON.stringify(selectedExample.content, null, 2), selectedExample.id)}
                    title="Copy content"
                  >
                    {copiedId === selectedExample.id ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => downloadContent(selectedExample.content, selectedExample.title)}
                    title="Download content"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {/* Blog Post Example (ID 1) */}
              {selectedExample.id === 1 && selectedExample.content && (
                <div className="space-y-6">
                  {selectedExample.content.headline && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {selectedExample.content.headline}
                      </h2>
                      {selectedExample.content.stats && (
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>{selectedExample.content.stats.readTime}</span>
                          <span>•</span>
                          <span>{selectedExample.content.stats.wordCount}</span>
                          <span>•</span>
                          <span>{selectedExample.content.stats.targetAudience}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedExample.content.introduction && (
                    <div className="prose max-w-none">
                      <h3 className="text-xl font-semibold mb-3">Introduction</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedExample.content.introduction}
                      </p>
                    </div>
                  )}

                  {selectedExample.content.mainPoints && Array.isArray(selectedExample.content.mainPoints) && selectedExample.content.mainPoints.map((point, idx) => (
                    <div key={idx} className="border-l-4 border-purple-500 pl-6 py-2">
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">
                        {point.heading}
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {point.content}
                      </p>
                    </div>
                  ))}

                  {selectedExample.content.conclusion && (
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-xl font-semibold mb-3">Conclusion</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {selectedExample.content.conclusion}
                      </p>
                      {selectedExample.content.cta && (
                        <div className="bg-green-100 p-4 rounded border-l-4 border-green-600">
                          <p className="font-medium text-green-900">{selectedExample.content.cta}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Job Posting Example (ID 2) */}
              {selectedExample.id === 2 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
                    <h2 className="text-3xl font-bold mb-2">{selectedExample.content.title}</h2>
                    <p className="text-lg opacity-90">{selectedExample.content.company}</p>
                    <p className="text-xl mt-2">{selectedExample.content.location}</p>
                  </div>

                  {[
                    { title: "About Us", content: selectedExample.content.opening },
                    { title: "The Role", content: selectedExample.content.role },
                    { title: "What You Bring", content: selectedExample.content.requirements },
                    { title: "What We Offer", content: selectedExample.content.offer },
                    { title: "Our Values", content: selectedExample.content.culture },
                    { title: "Interview Process", content: selectedExample.content.process }
                  ].map((section, idx) => (
                    <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-xl font-semibold mb-3 text-gray-900">{section.title}</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  ))}

                  <div className="bg-indigo-50 p-6 rounded-lg border-2 border-indigo-300">
                    <h3 className="text-xl font-semibold mb-3 text-indigo-900">{selectedExample.content.cta.split('\n')[0]}</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedExample.content.cta}</p>
                    {selectedExample.content.ps && (
                      <p className="mt-4 text-sm italic text-gray-600">{selectedExample.content.ps}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Newsletter Example (ID 3) */}
              {selectedExample.id === 3 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-6 rounded-lg border-2 border-pink-200">
                    <h2 className="text-2xl font-bold mb-1">{selectedExample.content.subject}</h2>
                    <p className="text-sm text-gray-600">{selectedExample.content.preview}</p>
                    <p className="text-xs text-gray-500 mt-2">{selectedExample.content.header}</p>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedExample.content.greeting}
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="text-xl font-bold mb-2">{selectedExample.content.featured.headline}</h3>
                    <p className="text-gray-700 whitespace-pre-line">{selectedExample.content.featured.summary}</p>
                  </div>

                  {selectedExample.content.sections.map((section, idx) => (
                    <div key={idx} className="border-l-4 border-purple-300 pl-6">
                      <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
                      {section.items && section.items.map((item, i) => (
                        <div key={i} className="mb-3">
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      ))}
                      {section.resource && <p className="text-gray-700 whitespace-pre-line">{section.resource}</p>}
                      {section.story && <p className="text-gray-700 italic">{section.story}</p>}
                      {section.trending && (
                        <ul className="space-y-2">
                          {section.trending.map((item, i) => (
                            <li key={i} className="text-gray-700">{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-300">
                    <p className="font-semibold text-purple-900 mb-2 whitespace-pre-line">{selectedExample.content.cta}</p>
                  </div>
                </div>
              )}

              {/* Brand Story Example (ID 4) */}
              {selectedExample.id === 4 && (
                <div className="space-y-6">
                  <h2 className="text-4xl font-bold text-gray-900 text-center mb-8">
                    {selectedExample.content.title}
                  </h2>

                  {[
                    { content: selectedExample.content.origin },
                    { content: selectedExample.content.spark },
                    { content: selectedExample.content.journey },
                    { content: selectedExample.content.purpose }
                  ].map((section, idx) => (
                    <div key={idx} className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                        {section.content}
                      </p>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedExample.content.values.map((value, idx) => (
                      <Card key={idx} className="bg-amber-50 border-amber-200">
                        <CardContent className="pt-6">
                          <p className="font-medium text-gray-900 whitespace-pre-line">{value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-8 rounded-lg">
                    <p className="text-xl text-gray-800 leading-relaxed whitespace-pre-line">
                      {selectedExample.content.transformation}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 mb-4 whitespace-pre-line">
                      {selectedExample.content.future}
                    </p>
                  </div>
                </div>
              )}

              {/* Fundraising Appeal Example (ID 5) */}
              {selectedExample.id === 5 && (
                <div className="space-y-6">
                  <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
                    <h2 className="text-2xl font-bold text-red-900 mb-2">{selectedExample.content.subject}</h2>
                  </div>

                  {[
                    { title: "Opening", content: selectedExample.content.opening },
                    { title: "The Problem", content: selectedExample.content.problem },
                    { title: "Our Solution", content: selectedExample.content.solution },
                    { title: "Impact Story", content: selectedExample.content.impact },
                    { title: "Your Support Needed", content: selectedExample.content.ask },
                    { title: "Why Now", content: selectedExample.content.urgency },
                    { title: "How to Give", content: selectedExample.content.howToGive }
                  ].map((section, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                      <h3 className="text-lg font-semibold mb-3 text-gray-900">{section.title}</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  ))}

                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 rounded-lg text-center">
                    <p className="text-xl font-bold mb-4 whitespace-pre-line">{selectedExample.content.closing}</p>
                  </div>
                </div>
              )}

              {/* E-commerce Product Description (ID 6) */}
              {selectedExample.id === 6 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-8 rounded-lg text-center">
                    <h2 className="text-4xl font-bold mb-2">{selectedExample.content.productName}</h2>
                    <p className="text-xl opacity-90">{selectedExample.content.tagline}</p>
                    <div className="mt-6 flex items-center justify-center gap-4">
                      <span className="text-3xl font-bold">{selectedExample.content.price}</span>
                      <span className="text-sm line-through opacity-75">{selectedExample.content.comparePrice}</span>
                    </div>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedExample.content.hero}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedExample.content.features.map((feature, idx) => (
                      <Card key={idx} className="bg-teal-50 border-teal-200">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                          <p className="text-gray-700 text-sm">{feature.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {[
                    { title: "Sizing Guide", content: selectedExample.content.sizing },
                    { title: "Care Instructions", content: selectedExample.content.care },
                    { title: "Sustainability", content: selectedExample.content.sustainability }
                  ].map((section, idx) => (
                    <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-3">{section.title}</h3>
                      <p className="text-gray-700 whitespace-pre-line">{section.content}</p>
                    </div>
                  ))}

                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="w-6 h-6 text-yellow-600 fill-current" />
                      <div>
                        <span className="text-2xl font-bold text-yellow-900">{selectedExample.content.reviews.rating}</span>
                        <span className="text-gray-600 ml-2">({selectedExample.content.reviews.count} reviews)</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {selectedExample.content.reviews.highlights.map((review, idx) => (
                        <p key={idx} className="text-sm italic text-gray-700">{review}</p>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-lg">
                    <p className="text-lg font-semibold mb-4 whitespace-pre-line">{selectedExample.content.cta}</p>
                  </div>
                </div>
              )}

              {/* Video Script (ID 7) */}
              {selectedExample.id === 7 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-6 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <Video className="w-8 h-8" />
                      <h2 className="text-2xl font-bold">{selectedExample.content.title}</h2>
                    </div>
                    <p className="text-sm opacity-90">10-minute educational video • Personal Finance</p>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
                    <h3 className="font-semibold text-lg mb-3">📹 Hook (0:00-0:30)</h3>
                    <p className="text-gray-700 whitespace-pre-line font-mono text-sm">{selectedExample.content.hook}</p>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
                    <h3 className="font-semibold text-lg mb-3">👋 Introduction (0:30-1:00)</h3>
                    <p className="text-gray-700 whitespace-pre-line font-mono text-sm">{selectedExample.content.intro}</p>
                  </div>

                  {selectedExample.content.sections.map((section, idx) => (
                    <div key={idx} className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-500">
                      <h3 className="font-semibold text-lg mb-3">
                        📌 {section.title} ({1 + idx * 2}:00-{3 + idx * 2}:00)
                      </h3>
                      <p className="text-gray-700 whitespace-pre-line font-mono text-sm">{section.content}</p>
                    </div>
                  ))}

                  <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
                    <h3 className="font-semibold text-lg mb-3">📊 Results Summary (9:00-9:30)</h3>
                    <p className="text-gray-700 whitespace-pre-line font-mono text-sm">{selectedExample.content.results}</p>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-lg border-l-4 border-indigo-500">
                    <h3 className="font-semibold text-lg mb-3">✅ Action Steps (9:30-10:00)</h3>
                    <p className="text-gray-700 whitespace-pre-line font-mono text-sm">{selectedExample.content.actionSteps}</p>
                  </div>

                  <div className="bg-gray-800 text-white p-6 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">🎬 Outro</h3>
                    <p className="whitespace-pre-line font-mono text-sm">{selectedExample.content.outro}</p>
                  </div>
                </div>
              )}

              {/* Landing Page (ID 8) */}
              {selectedExample.id === 8 && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg text-center">
                    <h2 className="text-4xl font-bold mb-4">{selectedExample.content.headline}</h2>
                    <p className="text-xl mb-6">{selectedExample.content.subheadline}</p>
                    <Button className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                      Start Free 14-Day Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm mt-4 opacity-75">No credit card required • Cancel anytime</p>
                  </div>

                  <div className="prose max-w-none">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {selectedExample.content.hero}
                    </p>
                  </div>

                  <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                    <h3 className="text-2xl font-bold mb-4 text-red-900">{selectedExample.content.problem.title}</h3>
                    <ul className="space-y-2">
                      {selectedExample.content.problem.points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-red-600 font-bold text-xl">✗</span>
                          <span className="text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                    <h3 className="text-2xl font-bold mb-4 text-green-900">{selectedExample.content.solution.title}</h3>
                    <p className="text-gray-700 mb-6">{selectedExample.content.solution.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedExample.content.solution.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                          <span className="text-3xl">{feature.icon}</span>
                          <div>
                            <h4 className="font-semibold text-lg mb-1">{feature.title}</h4>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-2xl font-bold mb-6 text-center">{selectedExample.content.socialProof.title}</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-8">
                      {selectedExample.content.socialProof.companies.map((company, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg text-center font-semibold text-gray-700">
                          {company}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedExample.content.socialProof.testimonials.map((testimonial, idx) => (
                        <Card key={idx}>
                          <CardContent className="pt-6">
                            <p className="text-sm italic mb-4">"{testimonial.quote}"</p>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{testimonial.image}</span>
                              <div>
                                <p className="font-semibold text-sm">{testimonial.author}</p>
                                <p className="text-xs text-gray-600">{testimonial.role}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-lg text-center">
                    <h3 className="text-3xl font-bold mb-4">{selectedExample.content.cta.title}</h3>
                    <p className="text-lg mb-6">{selectedExample.content.cta.description}</p>
                    <Button className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-6 mb-4">
                      {selectedExample.content.cta.button}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-sm opacity-90">{selectedExample.content.cta.subtext}</p>
                    <p className="text-sm mt-4 font-semibold">{selectedExample.content.cta.urgency}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced CTA Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-white/[0.2] bg-[length:20px_20px]"></div>
            <CardContent className="pt-12 pb-12 relative z-10">
              <div className="text-center max-w-4xl mx-auto">
                <Sparkles className="w-16 h-16 mx-auto mb-6 animate-pulse" />
                <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                  {currentUser ? "Create More Content Like This" : "Ready to Create Content Like This?"}
                </h3>
                <p className="text-xl mb-8 opacity-90">
                  {currentUser 
                    ? "Use our AI personas and templates to generate professional content for any purpose"
                    : "Join thousands of creators using AI to produce professional content in minutes, not hours"}
                </p>

                {!currentUser && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
                      {[
                        { icon: Zap, title: "Generate in Seconds", desc: "AI creates complete content instantly" },
                        { icon: Target, title: "Perfect Every Time", desc: "Consistent quality across all content" },
                        { icon: TrendingUp, title: "Scale Effortlessly", desc: "Create unlimited content variations" }
                      ].map((benefit, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                          <benefit.icon className="w-8 h-8 mb-3" />
                          <h4 className="font-bold mb-1">{benefit.title}</h4>
                          <p className="text-sm text-purple-100">{benefit.desc}</p>
                        </div>
                      ))}
                    </div>

                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-12 py-6 shadow-2xl mb-4"
                      onClick={() => apiClient.auth.redirectToLogin()}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Creating for Free
                    </Button>
                    <p className="text-sm text-purple-100">
                      No credit card required • Free forever plan • Full access to templates & personas
                    </p>
                  </>
                )}

                {currentUser && (
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={createPageUrl('Templates')}>
                      <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8">
                        Browse Templates
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to={createPageUrl('PersonasLibrary')}>
                      <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white/10 text-lg px-8">
                        Explore Personas
                        <Users className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
