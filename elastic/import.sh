
xxx=""
for i in ActivityLog Template TestCase TemplateComment Persona AgentPackage AgentSubscription AgentReview APIKey TrainingDataset AgentTraining CustomAgentVersion AlertConfiguration Notification AgentMonitoringLog AgentMetrics Bookmark FineTuningJob VectorDocument UserAPIKey TestHistory Workflow APIConfiguration PersonaComment VoiceChat KnowledgeBase ContentHistory DocumentExport ContentExample LLMLog PlaceholderPreset PublishingAPIKey APISettings SlackMessage CompanySettings LibraryItem ChatSessionParticipant ChatMessageAnnotation ChatSessionVersion CustomTool Project WorkflowComponent Workspace WorkspaceMember GenerationPreset; do 
		 
curl -s 'https://app.base44.com/api/apps/6901f73a3178f5670b5f2458/entities/'$i'?sort=-created_date'    | jq > ./$i.json;
idx=$(echo "prompt-hub-$i" | tr [A-Z] [a-z] | tr -d "_" ); 
python3.9  ./import.py --url http://localhost:9200 --file ./$i.json --index $idx;
done


for i in  AgentMetrics AgentMonitoringLog AgentPackage AgentReview AgentSubscription AgentTraining AlertConfiguration APIConfiguration APIKey APISettings Bookmark ChatMessageAnnotation ChatSessionParticipant ChatSessionVersion CompanySettings ContentExample ContentHistory CustomAgentVersion CustomTool DocumentExport FineTuningJob KnowledgeBase LibraryItem LLMLog Notification Persona PersonaComment PlaceholderPreset Project PublishingAPIKey SlackMessage Template TemplateComment TestCase TestHistory TrainingDataset UserAPIKey VectorDocument VoiceChat Workflow WorkflowComponent WorkspaceMember GenerationPreset; do 
idx=$(echo "prompt-hub-$i" | tr [A-Z] [a-z] | tr -d "_" ); 
echo "{ name: '$i', defaultIndex: '"$idx"', icon: Box },"
done
