import React, { useState, useMemo } from 'react';
import { apiClient } from '@/apis/client';
import { X, Lightbulb, Clock, ChevronsRight, Save, RotateCcw, Send } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const techniques = [
    {
        id: 'random_word',
        title: 'Random Word',
        steps: ['Get a random word from the AI.', 'Force a connection between the word and your topic.', 'Explore the new idea that emerges.'],
        whenToUse: 'Blocked',
        time: 5,
        proTip: 'Don\'t self-censor. The more absurd the connection, the more original the idea might be.',
        example: 'Topic: Productivity. Random Word: "Cloud". Idea: A system that visualizes tasks as a weather map, showing "stormy" projects and "clear" days.'
    },
    {
        id: 'scamper',
        title: 'SCAMPER',
        steps: ['Substitute: What can you swap?', 'Combine: What can you merge?', 'Adapt: What can you adapt?', 'Modify: Can you change the scale?', 'Put to another use: How else can it be used?', 'Eliminate: What can you remove?', 'Reverse: What if you did the opposite?'],
        whenToUse: 'Idea Expansion',
        time: 30,
        proTip: 'Go through each letter one by one. Not all will apply, but one might unlock a breakthrough.',
        example: 'Idea: A coffee cup. Reverse: A cup that cools drinks down instead of keeping them warm.'
    },
    {
        id: 'six_hats',
        title: 'Six Thinking Hats',
        steps: ['White Hat: State the facts.', 'Red Hat: Share your gut feelings.', 'Black Hat: Point out the risks.', 'Yellow Hat: Highlight the benefits.', 'Green Hat: Brainstorm new possibilities.', 'Blue Hat: Summarize and decide.'],
        whenToUse: 'Idea Expansion',
        time: 30,
        proTip: 'Physically or mentally "wear" each hat to fully commit to that perspective.',
        example: 'Exploring a new video series idea from all angles to identify blind spots before filming.'
    },
    {
        id: 'forced_connection',
        title: 'Forced Connection',
        steps: ['Pick your current topic.', 'Pick a random, unrelated object (e.g., from your desk).', 'List attributes of the object.', 'Force connections between the attributes and your topic.'],
        whenToUse: 'Blocked',
        time: 5,
        proTip: 'Focus on the functions and feelings of the random object, not just its appearance.',
        example: 'Topic: Fitness app. Object: A key. Idea: An app where you "unlock" new workout levels or achievements.'
    },
    {
        id: '20_uses',
        title: '20 Uses Challenge',
        steps: ['Take a common object or concept related to your niche.', 'List 20 alternative or unexpected uses for it.', 'Review the list for content ideas.'],
        whenToUse: 'Idea Expansion',
        time: 30,
        proTip: 'The first 5 are easy, the next 5 are hard, the last 10 are where true creativity happens.',
        example: 'Concept: A Tweet. Uses: A poem, a video script, a T-shirt slogan, a chapter title, a character quote...'
    },
    {
        id: 'constraint_challenge',
        title: 'Constraint Challenge',
        steps: ['Define your idea or message.', 'Apply a strict constraint (e.g., explain it in 10 words, 30 seconds, or a single image).', 'The constraint forces you to find the core essence.'],
        whenToUse: 'Blocked',
        time: 5,
        proTip: 'Constraints aren\'t limitations; they\'re creativity catalysts.',
        example: 'Pitching a complex software in a single sentence to find its most important benefit.'
    },
    {
        id: 'role_storming',
        title: 'Role Storming',
        steps: ['Define the problem you\'re trying to solve.', 'Choose a persona (e.g., Elon Musk, a 5-year-old, a skeptical grandparent).', 'Brainstorm solutions from that persona\'s point of view.'],
        whenToUse: 'Idea Expansion',
        time: 30,
        proTip: 'Embody the persona. How would they talk? What would they care about? What would they ignore?',
        example: 'Problem: Making saving money fun. Persona: A video game designer. Idea: A savings app that works like an RPG, where deposits level up a character.'
    },
    {
        id: 'analogies_method',
        title: 'Analogies Method',
        steps: ['Identify the core process of your topic.', 'Find an analogy from a completely different domain (e.g., nature, sports, cooking).', 'Apply the structure of the analogy back to your topic.'],
        whenToUse: 'Idea Expansion',
        time: 30,
        proTip: 'Look for systems and relationships in other domains that you can borrow.',
        example: 'Topic: Project management. Analogy: Gardening. Idea: "Seeding" projects, "watering" key tasks, "weeding" out distractions, and "harvesting" the results.'
    },
    {
        id: 'exquisite_corpse',
        title: 'Exquisite Corpse',
        steps: ['Start with a line of a story or a visual element.', 'The AI adds the next piece without seeing your full context.', 'You add the next piece based on the AI\'s contribution.', 'Repeat to co-create something unexpected.'],
        whenToUse: 'Visual Exploration',
        time: 5,
        proTip: 'Embrace the weirdness. The goal is surprise, not coherence.',
        example: 'Co-writing a short film script with an AI, one line at a time, leading to a bizarre and original plot.'
    },
    {
        id: 'one_minute_storyboard',
        title: 'One-Minute Storyboard',
        steps: ['Grab a pen and paper (or digital equivalent).', 'Set a timer for 60 seconds.', 'Rapidly sketch 3-5 simple frames for your video idea: Beginning, Middle, End.', 'Focus on the flow, not the details.'],
        whenToUse: 'Visual Exploration',
        time: 5,
        proTip: 'Use stick figures and simple shapes. This is about structure, not art.',
        example: 'Quickly visualizing a TikTok video to see if the hook, middle, and payoff work before committing to filming.'
    }
];

const contextFilters = ['All', 'Blocked', 'Idea Expansion', 'Visual Exploration'];
const timeFilters = ['All', '5 minutes', '30 minutes'];

// Random Word Challenge Component
const RandomWordChallenge = ({ technique, onSave }) => {
    const [topic, setTopic] = useState('');
    const [randomWord, setRandomWord] = useState('');
    const [connection, setConnection] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getWord = async () => {
        setIsLoading(true);
        setRandomWord('');
        try {
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ prompt: 'Generate a single, common, concrete, and interesting English noun. Return only the word itself, nothing else. For example: "Compass" or "Telescope".' });
            setRandomWord(res.trim().replace(/"/g, ''));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        const output = `Technique: ${technique.title}\nTopic: ${topic}\nRandom Word: ${randomWord}\n\nGenerated Idea:\n${connection}`;
        onSave(output, technique.title);
    };

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Topic/Idea</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., How to edit videos faster" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Random Word</label>
                        <div className="w-full p-2 border bg-white border-gray-300 rounded-md h-10 flex items-center">
                            {isLoading ? 'Generating...' : randomWord}
                        </div>
                    </div>
                    <button onClick={getWord} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">Get Word</button>
                </div>
                {randomWord && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Force a connection. How does "{randomWord}" relate to "{topic || 'your topic'}"?</label>
                        <textarea value={connection} onChange={(e) => setConnection(e.target.value)} placeholder="e.g., A compass helps you find your way, so my video editing course could be a 'Creative Compass'..." className="w-full p-2 border border-gray-300 rounded-md h-24"></textarea>
                    </div>
                )}
                {connection && <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"><Save className="w-4 h-4"/> Save to Idea Notebook</button>}
            </div>
        </div>
    );
};

// SCAMPER Challenge Component
const ScamperChallenge = ({ technique, onSave }) => {
    const [idea, setIdea] = useState('');
    const [responses, setResponses] = useState({});
    const [currentStep, setCurrentStep] = useState(0);

    const scamperSteps = [
        { key: 'substitute', question: 'What can you substitute or swap out?' },
        { key: 'combine', question: 'What can you combine or merge with this?' },
        { key: 'adapt', question: 'What can you adapt from elsewhere?' },
        { key: 'modify', question: 'How can you modify, magnify, or minimize it?' },
        { key: 'purpose', question: 'How else can this be used?' },
        { key: 'eliminate', question: 'What can you remove or eliminate?' },
        { key: 'reverse', question: 'What if you reversed or rearranged it?' }
    ];

    const handleStepResponse = (value) => {
        setResponses(prev => ({ ...prev, [scamperSteps[currentStep].key]: value }));
    };

    const nextStep = () => {
        if (currentStep < scamperSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSave = () => {
        const output = `Technique: ${technique.title}\nOriginal Idea: ${idea}\n\n${scamperSteps.map(step => `${step.key.toUpperCase()}: ${responses[step.key] || 'Not answered'}`).join('\n\n')}`;
        onSave(output, technique.title);
    };

    const isComplete = Object.keys(responses).length === scamperSteps.length && idea;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Original Idea</label>
                    <input type="text" value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g., A morning routine app" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                
                {idea && (
                    <div className="border rounded-lg p-4 bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <h5 className="font-semibold">Step {currentStep + 1} of {scamperSteps.length}: {scamperSteps[currentStep].key.toUpperCase()}</h5>
                            <div className="text-sm text-gray-500">{currentStep + 1}/{scamperSteps.length}</div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{scamperSteps[currentStep].question}</p>
                        <textarea 
                            value={responses[scamperSteps[currentStep].key] || ''} 
                            onChange={(e) => handleStepResponse(e.target.value)}
                            placeholder="Write your ideas here..."
                            className="w-full p-2 border border-gray-300 rounded-md h-20"
                        />
                        <div className="flex justify-between mt-3">
                            <button onClick={prevStep} disabled={currentStep === 0} className="px-3 py-1 bg-gray-200 text-gray-700 rounded disabled:opacity-50">Previous</button>
                            <button onClick={nextStep} disabled={currentStep === scamperSteps.length - 1} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
                        </div>
                    </div>
                )}
                
                {isComplete && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save to Idea Notebook
                    </button>
                )}
            </div>
        </div>
    );
};

// Six Thinking Hats Challenge Component  
const SixHatsChallenge = ({ technique, onSave }) => {
    const [topic, setTopic] = useState('');
    const [responses, setResponses] = useState({});
    const [currentHat, setCurrentHat] = useState(0);

    const hats = [
        { key: 'white', name: 'White Hat', question: 'What are the facts? What information do we have?', color: 'bg-gray-100' },
        { key: 'red', name: 'Red Hat', question: 'What are your gut feelings and emotions about this?', color: 'bg-red-100' },
        { key: 'black', name: 'Black Hat', question: 'What are the risks, problems, and potential downsides?', color: 'bg-gray-800 text-white' },
        { key: 'yellow', name: 'Yellow Hat', question: 'What are the benefits, positives, and opportunities?', color: 'bg-yellow-100' },
        { key: 'green', name: 'Green Hat', question: 'What new ideas and creative possibilities can you think of?', color: 'bg-green-100' },
        { key: 'blue', name: 'Blue Hat', question: 'What\'s your overall summary and next steps?', color: 'bg-blue-100' }
    ];

    const handleHatResponse = (value) => {
        setResponses(prev => ({ ...prev, [hats[currentHat].key]: value }));
    };

    const nextHat = () => {
        if (currentHat < hats.length - 1) {
            setCurrentHat(currentHat + 1);
        }
    };

    const prevHat = () => {
        if (currentHat > 0) {
            setCurrentHat(currentHat - 1);
        }
    };

    const handleSave = () => {
        const output = `Technique: ${technique.title}\nTopic: ${topic}\n\n${hats.map(hat => `${hat.name}: ${responses[hat.key] || 'Not explored'}`).join('\n\n')}`;
        onSave(output, technique.title);
    };

    const isComplete = Object.keys(responses).length === hats.length && topic;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Topic/Idea</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Starting a YouTube channel" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                
                {topic && (
                    <div className={`border rounded-lg p-4 ${hats[currentHat].color}`}>
                        <div className="flex justify-between items-center mb-3">
                            <h5 className="font-semibold">{hats[currentHat].name}</h5>
                            <div className="text-sm opacity-70">{currentHat + 1}/{hats.length}</div>
                        </div>
                        <p className="text-sm mb-3">{hats[currentHat].question}</p>
                        <textarea 
                            value={responses[hats[currentHat].key] || ''} 
                            onChange={(e) => handleHatResponse(e.target.value)}
                            placeholder="Share your thoughts from this perspective..."
                            className="w-full p-2 border border-gray-300 rounded-md h-20"
                        />
                        <div className="flex justify-between mt-3">
                            <button onClick={prevHat} disabled={currentHat === 0} className="px-3 py-1 bg-white bg-opacity-50 rounded disabled:opacity-50">Previous</button>
                            <button onClick={nextHat} disabled={currentHat === hats.length - 1} className="px-3 py-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100">Next Hat</button>
                        </div>
                    </div>
                )}
                
                {isComplete && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save to Idea Notebook
                    </button>
                )}
            </div>
        </div>
    );
};

// Forced Connection Challenge Component
const ForcedConnectionChallenge = ({ technique, onSave }) => {
    const [topic, setTopic] = useState('');
    const [object, setObject] = useState('');
    const [attributes, setAttributes] = useState('');
    const [connections, setConnections] = useState('');
    const [isGeneratingObject, setIsGeneratingObject] = useState(false);

    const generateRandomObject = async () => {
        setIsGeneratingObject(true);
        try {
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ 
                prompt: 'Generate a single, common, everyday object that would be found in a typical home or office. Return only the object name, nothing else. Examples: "Stapler", "Coffee mug", "Houseplant".' 
            });
            setObject(res.trim().replace(/"/g, ''));
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingObject(false);
        }
    };

    const handleSave = () => {
        const output = `Technique: ${technique.title}\nTopic: ${topic}\nRandom Object: ${object}\nObject Attributes: ${attributes}\n\nForced Connections:\n${connections}`;
        onSave(output, technique.title);
    };

    const isComplete = topic && object && attributes && connections;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Topic</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Improving team communication" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                
                <div className="flex items-end gap-4">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Random Object</label>
                        <input type="text" value={object} onChange={(e) => setObject(e.target.value)} placeholder="Pick something from your desk or use AI" className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                    <button onClick={generateRandomObject} disabled={isGeneratingObject} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                        {isGeneratingObject ? 'Getting...' : 'AI Object'}
                    </button>
                </div>
                
                {object && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">List attributes of "{object}" (function, appearance, feel, etc.)</label>
                            <textarea value={attributes} onChange={(e) => setAttributes(e.target.value)} placeholder="e.g., Round, smooth, holds liquid, portable, has a handle..." className="w-full p-2 border border-gray-300 rounded-md h-20"></textarea>
                        </div>
                        
                        {attributes && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Force connections between "{object}" and "{topic}"</label>
                                <textarea value={connections} onChange={(e) => setConnections(e.target.value)} placeholder="How do the attributes of the object relate to your topic? Be creative!" className="w-full p-2 border border-gray-300 rounded-md h-24"></textarea>
                            </div>
                        )}
                    </>
                )}
                
                {isComplete && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save to Idea Notebook
                    </button>
                )}
            </div>
        </div>
    );
};

// 20 Uses Challenge Component
const TwentyUsesChallenge = ({ technique, onSave }) => {
    const [object, setObject] = useState('');
    const [uses, setUses] = useState(['']);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

    const addUse = () => {
        setUses([...uses, '']);
    };

    const updateUse = (index, value) => {
        const newUses = [...uses];
        newUses[index] = value;
        setUses(newUses);
    };

    const removeUse = (index) => {
        setUses(uses.filter((_, i) => i !== index));
    };

    const getSuggestions = async () => {
        if (!object || uses.filter(u => u.trim()).length === 0) return;
        
        setIsGeneratingSuggestions(true);
        try {
            const existingUses = uses.filter(u => u.trim()).join(', ');
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ 
                prompt: `Given the object "${object}" and these existing uses: ${existingUses}, suggest 3 more creative and unusual uses for this object. Return as a simple list, one use per line.` 
            });
            const suggestions = res.split('\n').map(s => s.replace(/^\d+\.?\s*/, '').trim()).filter(s => s);
            setUses(prev => [...prev, ...suggestions]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleSave = () => {
        const validUses = uses.filter(u => u.trim());
        const output = `Technique: ${technique.title}\nObject/Concept: ${object}\n\n20 Alternative Uses:\n${validUses.map((use, i) => `${i + 1}. ${use}`).join('\n')}`;
        onSave(output, technique.title);
    };

    const validUseCount = uses.filter(u => u.trim()).length;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Object or Concept</label>
                    <input type="text" value={object} onChange={(e) => setObject(e.target.value)} placeholder="e.g., A paperclip, A tweet, A smartphone" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                
                {object && (
                    <>
                        <div className="flex justify-between items-center">
                            <h5 className="font-semibold">Alternative Uses ({validUseCount}/20)</h5>
                            <div className="flex gap-2">
                                <button onClick={getSuggestions} disabled={isGeneratingSuggestions} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-blue-300">
                                    {isGeneratingSuggestions ? 'Getting ideas...' : 'AI Help'}
                                </button>
                                <button onClick={addUse} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">+ Add</button>
                            </div>
                        </div>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {uses.map((use, index) => (
                                <div key={index} className="flex gap-2">
                                    <span className="text-sm text-gray-500 mt-2 w-6">{index + 1}.</span>
                                    <input 
                                        type="text" 
                                        value={use} 
                                        onChange={(e) => updateUse(index, e.target.value)}
                                        placeholder={`Use #${index + 1}`}
                                        className="flex-grow p-2 border border-gray-300 rounded text-sm"
                                    />
                                    {uses.length > 1 && (
                                        <button onClick={() => removeUse(index)} className="px-2 py-1 text-red-600 text-sm hover:bg-red-100 rounded">×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {validUseCount >= 10 && (
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                                <Save className="w-4 h-4"/> Save to Idea Notebook ({validUseCount} uses)
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Constraint Challenge Component
const ConstraintChallenge = ({ technique, onSave }) => {
    const [idea, setIdea] = useState('');
    const [constraintType, setConstraintType] = useState('');
    const [constraintValue, setConstraintValue] = useState('');
    const [response, setResponse] = useState('');
    const [feedback, setFeedback] = useState('');
    const [isChecking, setIsChecking] = useState(false);

    const constraints = [
        { type: 'words', label: 'Word Limit', placeholder: 'e.g., 10', unit: 'words' },
        { type: 'seconds', label: 'Time Limit', placeholder: 'e.g., 30', unit: 'seconds' },
        { type: 'characters', label: 'Character Limit', placeholder: 'e.g., 140', unit: 'characters' },
        { type: 'sentences', label: 'Sentence Limit', placeholder: 'e.g., 2', unit: 'sentences' }
    ];

    const checkConstraint = async () => {
        if (!response.trim() || !constraintType || !constraintValue) return;
        
        setIsChecking(true);
        try {
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ 
                prompt: `Check if this response meets the constraint. Original idea: "${idea}". Constraint: ${constraintValue} ${constraintType}. Response: "${response}". Does it meet the constraint? Provide brief feedback on whether it succeeds and how it could be improved.` 
            });
            setFeedback(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsChecking(false);
        }
    };

    const handleSave = () => {
        const selectedConstraint = constraints.find(c => c.type === constraintType);
        const output = `Technique: ${technique.title}\nOriginal Idea: ${idea}\nConstraint: ${constraintValue} ${selectedConstraint?.unit || constraintType}\n\nConstrained Response:\n${response}\n\nFeedback: ${feedback}`;
        onSave(output, technique.title);
    };

    const isComplete = idea && constraintType && constraintValue && response;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Idea/Message</label>
                    <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe your idea in full detail first..." className="w-full p-2 border border-gray-300 rounded-md h-20"></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Constraint Type</label>
                        <select value={constraintType} onChange={(e) => setConstraintType(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                            <option value="">Choose constraint...</option>
                            {constraints.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                        <input type="number" value={constraintValue} onChange={(e) => setConstraintValue(e.target.value)} placeholder={constraints.find(c => c.type === constraintType)?.placeholder || 'Number'} className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                </div>
                
                {idea && constraintType && constraintValue && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Now explain your idea in {constraintValue} {constraints.find(c => c.type === constraintType)?.unit} or less
                            </label>
                            <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Your constrained version here..." className="w-full p-2 border border-gray-300 rounded-md h-20"></textarea>
                        </div>
                        
                        {response && (
                            <div className="flex gap-2">
                                <button onClick={checkConstraint} disabled={isChecking} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                                    {isChecking ? 'Checking...' : 'Check Constraint'}
                                </button>
                            </div>
                        )}
                        
                        {feedback && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-800">{feedback}</p>
                            </div>
                        )}
                    </>
                )}
                
                {isComplete && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save to Idea Notebook
                    </button>
                )}
            </div>
        </div>
    );
};

// Role Storming Challenge Component
const RoleStormingChallenge = ({ technique, onSave }) => {
    const [problem, setProblem] = useState('');
    const [selectedPersona, setSelectedPersona] = useState('');
    const [customPersona, setCustomPersona] = useState('');
    const [solution, setSolution] = useState('');
    const [isGeneratingContext, setIsGeneratingContext] = useState(false);
    const [personaContext, setPersonaContext] = useState('');

    const personas = [
        'Elon Musk', 'A 5-year-old child', 'A skeptical grandparent', 'A video game designer', 
        'A minimalist', 'A busy parent', 'A startup founder', 'A teacher', 'A chef', 'Custom'
    ];

    const getPersonaContext = async () => {
        const persona = selectedPersona === 'Custom' ? customPersona : selectedPersona;
        if (!persona || !problem) return;
        
        setIsGeneratingContext(true);
        try {
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ 
                prompt: `You are ${persona}. Given this problem: "${problem}", what would be your unique perspective, priorities, and approach? Respond in character with 2-3 sentences about how you'd think about this problem.` 
            });
            setPersonaContext(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingContext(false);
        }
    };

    const handleSave = () => {
        const persona = selectedPersona === 'Custom' ? customPersona : selectedPersona;
        const output = `Technique: ${technique.title}\nProblem: ${problem}\nPersona: ${persona}\n\nPersona Context: ${personaContext}\n\nSolution from ${persona}'s perspective:\n${solution}`;
        onSave(output, technique.title);
    };

    const isComplete = problem && (selectedPersona !== 'Custom' ? selectedPersona : customPersona) && solution;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Problem to Solve</label>
                    <textarea value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="e.g., How to make saving money more engaging for young people" className="w-full p-2 border border-gray-300 rounded-md h-20"></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Choose a Persona</label>
                    <select value={selectedPersona} onChange={(e) => setSelectedPersona(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="">Select persona...</option>
                        {personas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                
                {selectedPersona === 'Custom' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Persona</label>
                        <input type="text" value={customPersona} onChange={(e) => setCustomPersona(e.target.value)} placeholder="e.g., A medieval knight, A social media influencer" className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                )}
                
                {problem && (selectedPersona && selectedPersona !== 'Custom' || customPersona) && (
                    <>
                        <button onClick={getPersonaContext} disabled={isGeneratingContext} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                            {isGeneratingContext ? 'Getting perspective...' : 'Get Persona Perspective'}
                        </button>
                        
                        {personaContext && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-800 italic">"{personaContext}"</p>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your solution as {selectedPersona === 'Custom' ? customPersona : selectedPersona}
                            </label>
                            <textarea value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Think like this persona. How would they approach the problem?" className="w-full p-2 border border-gray-300 rounded-md h-24"></textarea>
                        </div>
                    </>
                )}
                
                {isComplete && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save to Idea Notebook
                    </button>
                )}
            </div>
        </div>
    );
};

// Analogies Method Challenge Component  
const AnalogiesChallenge = ({ technique, onSave }) => {
    const [topic, setTopic] = useState('');
    const [domain, setDomain] = useState('');
    const [customDomain, setCustomDomain] = useState('');
    const [analogy, setAnalogy] = useState('');
    const [application, setApplication] = useState('');
    const [isGeneratingAnalogy, setIsGeneratingAnalogy] = useState(false);

    const domains = [
        'Nature', 'Sports', 'Cooking', 'Music', 'Architecture', 'Transportation', 
        'Medicine', 'Gardening', 'Weather', 'Ocean/Water', 'Custom'
    ];

    const generateAnalogy = async () => {
        const selectedDomain = domain === 'Custom' ? customDomain : domain;
        if (!topic || !selectedDomain) return;
        
        setIsGeneratingAnalogy(true);
        try {
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ 
                prompt: `Create an analogy between "${topic}" and something from the domain of "${selectedDomain}". Explain the analogy in 2-3 sentences, focusing on the structural similarities and processes.` 
            });
            setAnalogy(res);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingAnalogy(false);
        }
    };

    const handleSave = () => {
        const selectedDomain = domain === 'Custom' ? customDomain : domain;
        const output = `Technique: ${technique.title}\nOriginal Topic: ${topic}\nAnalogy Domain: ${selectedDomain}\n\nAnalogy:\n${analogy}\n\nApplication back to original topic:\n${application}`;
        onSave(output, technique.title);
    };

    const isComplete = topic && (domain !== 'Custom' ? domain : customDomain) && analogy && application;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Topic/Process</label>
                    <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Project management, Learning a skill, Building an audience" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Analogy Domain</label>
                    <select value={domain} onChange={(e) => setDomain(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="">Choose a domain...</option>
                        {domains.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                
                {domain === 'Custom' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
                        <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="e.g., Military strategy, Board games, Fashion" className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>
                )}
                
                {topic && (domain && domain !== 'Custom' || customDomain) && (
                    <>
                        <button onClick={generateAnalogy} disabled={isGeneratingAnalogy} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">
                            {isGeneratingAnalogy ? 'Creating analogy...' : 'Generate Analogy'}
                        </button>
                        
                        {analogy && (
                            <>
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-sm text-blue-800">{analogy}</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apply this analogy back to your original topic</label>
                                    <textarea value={application} onChange={(e) => setApplication(e.target.value)} placeholder="How can you use the structure/process from this analogy to improve your approach to the original topic?" className="w-full p-2 border border-gray-300 rounded-md h-24"></textarea>
                                </div>
                            </>
                        )}
                    </>
                )}
                
                {isComplete && (
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                        <Save className="w-4 h-4"/> Save to Idea Notebook
                    </button>
                )}
            </div>
        </div>
    );
};

// Exquisite Corpse Challenge Component
const ExquisiteCorpseChallenge = ({ technique, onSave }) => {
    const [story, setStory] = useState([]);
    const [currentLine, setCurrentLine] = useState('');
    const [isAiTurn, setIsAiTurn] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const startStory = () => {
        if (!currentLine.trim()) return;
        setStory([{ author: 'You', text: currentLine }]);
        setCurrentLine('');
        setIsAiTurn(true);
    };

    const addAiLine = async () => {
        if (story.length === 0) return;
        
        setIsGenerating(true);
        try {
            const lastLine = story[story.length - 1].text;
            const res = await apiClient.integrations.Core.InvokeLLMwithLogging({ 
                prompt: `Continue this story with exactly one sentence. Only see this last line: "${lastLine}". Add something unexpected but coherent. Don't repeat what was already said.` 
            });
            setStory(prev => [...prev, { author: 'AI', text: res.trim() }]);
            setIsAiTurn(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const addUserLine = () => {
        if (!currentLine.trim()) return;
        setStory(prev => [...prev, { author: 'You', text: currentLine }]);
        setCurrentLine('');
        setIsAiTurn(true);
    };

    const handleSave = () => {
        const output = `Technique: ${technique.title}\n\nCollaborative Story:\n\n${story.map((line, i) => `${i + 1}. [${line.author}] ${line.text}`).join('\n\n')}`;
        onSave(output, technique.title);
    };

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                {story.length === 0 ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start the story with one line</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={currentLine} 
                                onChange={(e) => setCurrentLine(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && startStory()}
                                placeholder="e.g., The elevator stopped between floors, but when it opened..."
                                className="flex-grow p-2 border border-gray-300 rounded-md" 
                            />
                            <button onClick={startStory} disabled={!currentLine.trim()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">Start</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg p-4 border max-h-60 overflow-y-auto">
                            {story.map((line, index) => (
                                <div key={index} className={`mb-2 p-2 rounded ${line.author === 'You' ? 'bg-blue-50' : 'bg-green-50'}`}>
                                    <span className="font-semibold text-xs">{line.author}:</span>
                                    <p className="text-sm mt-1">{line.text}</p>
                                </div>
                            ))}
                        </div>
                        
                        {isAiTurn ? (
                            <button onClick={addAiLine} disabled={isGenerating} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300">
                                {isGenerating ? 'AI is writing...' : 'AI Add Line'}
                            </button>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your turn - add the next line</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={currentLine} 
                                        onChange={(e) => setCurrentLine(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addUserLine()}
                                        placeholder="Continue the story..."
                                        className="flex-grow p-2 border border-gray-300 rounded-md" 
                                    />
                                    <button onClick={addUserLine} disabled={!currentLine.trim()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300">Add</button>
                                </div>
                            </div>
                        )}
                        
                        {story.length >= 4 && (
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                                <Save className="w-4 h-4"/> Save Story to Idea Notebook
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// One Minute Storyboard Challenge Component
const OneMinuteStoryboardChallenge = ({ technique, onSave }) => {
    const [videoIdea, setVideoIdea] = useState('');
    const [timeLeft, setTimeLeft] = useState(60);
    const [isActive, setIsActive] = useState(false);
    const [frames, setFrames] = useState([
        { label: 'Opening/Hook', content: '' },
        { label: 'Middle/Content', content: '' },
        { label: 'End/CTA', content: '' }
    ]);

    React.useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const startTimer = () => {
        setIsActive(true);
        setTimeLeft(60);
    };

    const stopTimer = () => {
        setIsActive(false);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(60);
    };

    const updateFrame = (index, content) => {
        const newFrames = [...frames];
        newFrames[index].content = content;
        setFrames(newFrames);
    };

    const addFrame = () => {
        setFrames([...frames, { label: `Frame ${frames.length + 1}`, content: '' }]);
    };

    const handleSave = () => {
        const output = `Technique: ${technique.title}\nVideo Idea: ${videoIdea}\n\nStoryboard Frames:\n${frames.map((frame, i) => `${i + 1}. ${frame.label}: ${frame.content}`).join('\n\n')}`;
        onSave(output, technique.title);
    };

    const hasContent = frames.some(f => f.content.trim()) && videoIdea;

    return (
        <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-bold text-lg mb-4 text-gray-900">Challenge: {technique.title}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Video Idea</label>
                    <input type="text" value={videoIdea} onChange={(e) => setVideoIdea(e.target.value)} placeholder="e.g., Morning routine for productivity" className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                    <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="flex gap-2">
                        {!isActive && timeLeft === 60 && (
                            <button onClick={startTimer} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Start 60s</button>
                        )}
                        {isActive && (
                            <button onClick={stopTimer} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Pause</button>
                        )}
                        {!isActive && timeLeft < 60 && (
                            <button onClick={() => setIsActive(true)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Resume</button>
                        )}
                        <button onClick={resetTimer} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Reset</button>
                    </div>
                </div>
                
                {videoIdea && (
                    <>
                        <div className="space-y-3">
                            {frames.map((frame, index) => (
                                <div key={index} className="border rounded p-3 bg-white">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{frame.label}</label>
                                    <input 
                                        type="text" 
                                        value={frame.content} 
                                        onChange={(e) => updateFrame(index, e.target.value)}
                                        placeholder="Quick description or sketch notes..."
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                    />
                                </div>
                            ))}
                        </div>
                        
                        <button onClick={addFrame} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">+ Add Frame</button>
                        
                        {hasContent && (
                            <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2">
                                <Save className="w-4 h-4"/> Save Storyboard to Idea Notebook
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Main Modal Component
export default function CreativePlaygroundModal({ onClose }) {
    const [contextFilter, setContextFilter] = useState('All');
    const [timeFilter, setTimeFilter] = useState('All');
    const [activeTechnique, setActiveTechnique] = useState(null);
    const [showToast, setShowToast] = useState('');
    const queryClient = useQueryClient();

    const filteredTechniques = useMemo(() => {
        return techniques.filter(t => {
            const contextMatch = contextFilter === 'All' || t.whenToUse === contextFilter;
            const timeMatch = timeFilter === 'All' || t.time === parseInt(timeFilter.split(' ')[0]);
            return contextMatch && timeMatch;
        });
    }, [contextFilter, timeFilter]);
    
    const handleSaveToNotebook = async (content, techniqueTitle) => {
        try {
            // Save to ContentHistory
            await apiClient.entities.ContentHistory.create({
                tool_type: 'creative_playground',
                topic: techniqueTitle,
                content: content,
                custom_instructions: `Technique: ${techniqueTitle}`,
                generated_content: [{
                    title: techniqueTitle,
                    content: content
                }]
            });
            
            // Also save to LibraryItem for backward compatibility
            await apiClient.entities.LibraryItem.create({
                type: 'playground_idea',
                content: content,
                source_module: 'Creative Playground',
                platform_or_style: techniqueTitle
            });
            
            setShowToast('Saved to Idea Notebook!');
            queryClient.invalidateQueries(['libraryItems']);
            setTimeout(() => setShowToast(''), 3000);
            setActiveTechnique(null);
        } catch (e) {
            console.error(e);
            setShowToast('Failed to save idea.');
            setTimeout(() => setShowToast(''), 3000);
        }
    };
    
    const renderChallenge = () => {
        if (!activeTechnique) return null;
        
        switch(activeTechnique.id) {
            case 'random_word':
                return <RandomWordChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'scamper':
                return <ScamperChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'six_hats':
                return <SixHatsChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'forced_connection':
                return <ForcedConnectionChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case '20_uses':
                return <TwentyUsesChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'constraint_challenge':
                return <ConstraintChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'role_storming':
                return <RoleStormingChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'analogies_method':
                return <AnalogiesChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'exquisite_corpse':
                return <ExquisiteCorpseChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            case 'one_minute_storyboard':
                return <OneMinuteStoryboardChallenge technique={activeTechnique} onSave={handleSaveToNotebook} />;
            default:
                return null;
        }
    };
    
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
            onClick={handleBackdropClick}
        >
            <div className="bg-white max-w-5xl w-full mx-4 shadow-xl max-h-[90vh] flex flex-col rounded-2xl">
                <div className="p-8 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>Creative Playground</h2>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <p className="text-gray-600 mt-1 subtitle">A library of proven techniques to spark creative ideas when you need them most.</p>
                </div>
                
                <div className="flex-grow overflow-y-auto p-8">
                    {activeTechnique ? (
                        <div>
                            <button onClick={() => setActiveTechnique(null)} className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-800">
                                ← Back to all techniques
                            </button>
                            {renderChallenge()}
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap gap-x-6 gap-y-4 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Context</label>
                                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                        {contextFilters.map(f => <button key={f} onClick={() => setContextFilter(f)} className={`px-3 py-1 text-sm rounded-md transition-colors ${contextFilter === f ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}>{f}</button>)}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Time</label>
                                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                                        {timeFilters.map(f => <button key={f} onClick={() => setTimeFilter(f)} className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === f ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}>{f}</button>)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTechniques.map(tech => (
                                    <div key={tech.id} className="border border-gray-200 rounded-xl p-5 flex flex-col hover:shadow-lg transition-shadow">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{tech.title}</h3>
                                        <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{tech.whenToUse}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{tech.time} min</span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-3"><strong className="font-medium text-gray-800">Steps:</strong> {tech.steps.slice(0,2).join(' ')}...</p>
                                        <p className="text-sm text-gray-700 mb-4 italic p-3 bg-gray-50 rounded-md"><strong>Pro Tip:</strong> {tech.proTip}</p>
                                        <div className="mt-auto">
                                            <button 
                                                onClick={() => setActiveTechnique(tech)} 
                                                className="w-full px-4 py-2 text-gray-900 font-semibold rounded-lg hover:opacity-80 transition-colors flex items-center justify-center gap-2"
                                                style={{ backgroundColor: '#EDE6F7' }}
                                            >
                                                Try it now <ChevronsRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            {showToast && (
                <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
                    {showToast}
                </div>
            )}
        </div>
    );
}
