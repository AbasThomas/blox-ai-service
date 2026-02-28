import { CORE_TEMPLATE_REGISTRY } from './template-registry';
import { TemplateRenderInput, TemplateRenderOutput } from './template-types';

export function renderTemplate(input: TemplateRenderInput): TemplateRenderOutput {
  const template = CORE_TEMPLATE_REGISTRY.find((item) => item.id === input.templateId);
  if (!template) {
    throw new Error(`Unknown template id: ${input.templateId}`);
  }

  const populatedSections: Record<string, unknown> = {};
  const missingSections: string[] = [];

  for (const section of template.sections) {
    const matchedKey = section.sourceKeys.find((key) => input.data[key] !== undefined);
    if (matchedKey) {
      populatedSections[section.id] = input.data[matchedKey];
    } else if (section.required) {
      missingSections.push(section.id);
    }
  }

  return {
    templateId: template.id,
    populatedSections,
    missingSections,
  };
}

