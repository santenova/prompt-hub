import { generateSimpleEmbedding } from './VectorUtils.jsx';
import { apiClient } from '@/apis/client';

export async function indexTemplate(template) {
  try {
    const content = `${template.title}\n\n${template.description || ''}\n\n${template.content}`;
    const vector = generateSimpleEmbedding(content);
    
    const existing = await apiClient.entities.VectorDocument.filter({
      'metadata.item_id': template.id,
      'metadata.category': 'template'
    });
    
    if (existing && existing.length > 0) {
      await apiClient.entities.VectorDocument.update(existing[0].id, {
        content,
        vector,
        metadata: {
          item_id: template.id,
          title: template.title,
          category: 'template',
          subcategory: template.category,
          tags: template.tags || [],
          source: 'auto-indexed'
        }
      });
    } else {
      await apiClient.entities.VectorDocument.create({
        content,
        vector,
        metadata: {
          item_id: template.id,
          title: template.title,
          category: 'template',
          subcategory: template.category,
          tags: template.tags || [],
          source: 'auto-indexed'
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to index template:', error);
    return { success: false, error };
  }
}

export async function indexPersona(persona) {
  try {
    const content = `${persona.name}\n\n${persona.description}\n\nInstructions: ${persona.instructions || ''}\n\nExpertise: ${persona.expertise_areas?.join(', ') || ''}`;
    const vector = generateSimpleEmbedding(content);
    
    const existing = await apiClient.entities.VectorDocument.filter({
      'metadata.item_id': persona.id,
      'metadata.category': 'persona'
    });
    
    if (existing && existing.length > 0) {
      await apiClient.entities.VectorDocument.update(existing[0].id, {
        content,
        vector,
        metadata: {
          item_id: persona.id,
          title: persona.name,
          category: 'persona',
          subcategory: persona.category,
          tags: persona.tags || [],
          source: 'auto-indexed'
        }
      });
    } else {
      await apiClient.entities.VectorDocument.create({
        content,
        vector,
        metadata: {
          item_id: persona.id,
          title: persona.name,
          category: 'persona',
          subcategory: persona.category,
          tags: persona.tags || [],
          source: 'auto-indexed'
        }
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to index persona:', error);
    return { success: false, error };
  }
}

export async function bulkIndexTemplates(templates) {
  const results = [];
  for (const template of templates) {
    const result = await indexTemplate(template);
    results.push({ id: template.id, ...result });
  }
  return results;
}

export async function bulkIndexPersonas(personas) {
  const results = [];
  for (const persona of personas) {
    const result = await indexPersona(persona);
    results.push({ id: persona.id, ...result });
  }
  return results;
}

export async function removeFromIndex(itemId, category) {
  try {
    const existing = await apiClient.entities.VectorDocument.filter({
      'metadata.item_id': itemId,
      'metadata.category': category
    });
    
    if (existing && existing.length > 0) {
      for (const doc of existing) {
        await apiClient.entities.VectorDocument.delete(doc.id);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to remove from index:', error);
    return { success: false, error };
  }
}
