export interface TemplateSection {
  id: string;
  title: string;
  required: boolean;
  sourceKeys: string[];
}

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'portfolio' | 'resume' | 'cover-letter';
  industry: string;
  sections: TemplateSection[];
}

export interface TemplateRenderInput {
  templateId: string;
  data: Record<string, unknown>;
}

export interface TemplateRenderOutput {
  templateId: string;
  populatedSections: Record<string, unknown>;
  missingSections: string[];
}

