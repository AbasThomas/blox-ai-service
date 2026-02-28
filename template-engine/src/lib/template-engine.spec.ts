import { renderTemplate } from './template-engine';

describe('renderTemplate', () => {
  it('should work', () => {
    const result = renderTemplate({
      templateId: 'portfolio-modern-001',
      data: {
        headline: 'Senior Product Designer',
        skills: ['Figma', 'Design Systems'],
        contact: { email: 'demo@blox.app' },
      },
    });

    expect(result.templateId).toEqual('portfolio-modern-001');
    expect(result.populatedSections['skills']).toBeDefined();
  });
});

