import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/apis/client';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

const fieldsToUpdate = [
    { value: 'category', label: 'Category', type: 'select', options: ["Science", "Business", "Creative", "Technical", "Education", "Health", "Finance", "Legal", "Marketing", "Sales", "Custom"] },
    { value: 'tone', label: 'Tone', type: 'select', options: ["Professional", "Friendly", "Formal", "Casual", "Enthusiastic", "Direct", "Empathetic"] },
    { value: 'status', label: 'Status', type: 'select', options: ["draft", "in_review", "published", "archived"]},
    { value: 'is_public', label: 'Public', type: 'boolean' },
    { value: 'project', label: 'Project', type: 'text' },
    { value: 'tags', label: 'Add Tag', type: 'text' },
];

export default function BatchUpdateModal({ open, onOpenChange, selectedPersonas, onClearSelection }) {
    const [field, setField] = useState('category');
    const [value, setValue] = useState('');
    const queryClient = useQueryClient();

    const updatePersonaMutation = useMutation({
        mutationFn: ({ id, data }) => apiClient.entities.Persona.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['personas']);
        },
    });

    const selectedField = fieldsToUpdate.find(f => f.value === field);

    useEffect(() => {
        if (selectedField?.type === 'boolean') {
            setValue(false);
        } else {
            setValue('');
        }
    }, [field, selectedField?.type]);

    const handleBatchUpdate = async () => {
        if (!field || (selectedField.type !== 'boolean' && !value)) return;

        const promises = selectedPersonas.map(persona => {
            let dataToUpdate;
            if (field === 'tags') {
                const newTags = persona.tags ? [...persona.tags] : [];
                if (value && !newTags.includes(value)) {
                    newTags.push(value);
                }
                dataToUpdate = { tags: newTags };
            } else {
                dataToUpdate = { [field]: value };
            }
            return updatePersonaMutation.mutateAsync({ id: persona.id, data: dataToUpdate });
        });

        await Promise.all(promises);
        onClearSelection();
        onOpenChange(false);
    };

    const renderValueInput = () => {
        if (!selectedField) return null;

        switch (selectedField.type) {
            case 'select':
                return (
                    <Select value={value} onValueChange={setValue}>
                        <SelectTrigger id="value">
                            <SelectValue placeholder="Select a value" />
                        </SelectTrigger>
                        <SelectContent>
                            {selectedField.options.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'boolean':
                return (
                     <div className="flex items-center gap-2 pt-2">
                        <Switch
                            id="value"
                            checked={value}
                            onCheckedChange={setValue}
                        />
                        <Label htmlFor="value">{value ? 'Public' : 'Not Public'}</Label>
                    </div>
                );
            case 'text':
                return (
                    <Input
                        id="value"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`Enter ${selectedField.label}`}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Batch Update {selectedPersonas.length} Personas</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="field">Field to Update</Label>
                        <Select value={field} onValueChange={setField}>
                            <SelectTrigger id="field">
                                <SelectValue placeholder="Select a field" />
                            </SelectTrigger>
                            <SelectContent>
                                {fieldsToUpdate.map(f => (
                                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="value">New Value</Label>
                        {renderValueInput()}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleBatchUpdate} disabled={updatePersonaMutation.isPending || !field || (selectedField.type !== 'boolean' && !value)}>
                        {updatePersonaMutation.isPending ? 'Updating...' : `Update ${selectedPersonas.length} Personas`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
