
xxx=""
for i in Template Persona; do 
idx=$(echo "prompt-hub-$i" | tr [A-Z] [a-z] | tr -d "_" ); 
python3.9  ./import.py --url http://localhost:9200 --file ./$i.json --index $idx;
done
