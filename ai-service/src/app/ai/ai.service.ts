import { Injectable, Logger } from '@nestjs/common';
import { AiJobResult, AiRoute, JobStatus } from '@nextjs-blox/shared-types';
import { GenerateDto } from './generate.dto';

type TextGenerator = (input: string, options?: Record<string, unknown>) => Promise<
  Array<{ generated_text: string }>
>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly pipelines = new Map<string, TextGenerator>();

  private readonly routeToModel: Record<AiRoute, string> = {
    generation_critique: 'Qwen/Qwen3-30B-A3B-Instruct-2507',
    reasoning_fallback: 'meta-llama/Llama-4-Scout-17B-Instruct',
    multilingual: 'zai-org/GLM-4.7-Flash',
    preview_fast: 'google/gemma-3-27b-it',
    edge_light: 'Qwen/Qwen3-8B',
  };

  async generate(dto: GenerateDto): Promise<AiJobResult> {
    const route = dto.preferredRoute ?? 'generation_critique';
    const modelId = this.routeToModel[route];
    const dryRun = (process.env.BLOX_AI_DRY_RUN ?? 'true') === 'true';

    try {
      const content = dryRun
        ? this.mockContent(dto.prompt)
        : await this.generateLocal(modelId, dto.prompt);

      return {
        jobId: crypto.randomUUID(),
        status: JobStatus.COMPLETED,
        content,
        routeUsed: route,
        modelId,
        fallbackUsed: false,
      };
    } catch (error) {
      this.logger.warn(`Local inference failed for ${modelId}, using HF fallback`);
      const fallback = await this.generateWithHf(modelId, dto.prompt);
      return {
        jobId: crypto.randomUUID(),
        status: JobStatus.FALLBACK_COMPLETED,
        content: fallback,
        routeUsed: route,
        modelId,
        fallbackUsed: true,
      };
    }
  }

  private async generateLocal(modelId: string, prompt: string): Promise<string> {
    if (!this.pipelines.has(modelId)) {
      const { pipeline } = await import('@huggingface/transformers');
      const pipelineFn = pipeline as unknown as (
        task: string,
        model: string,
      ) => Promise<TextGenerator>;
      const generator = await pipelineFn('text-generation', modelId);
      this.pipelines.set(modelId, generator);
    }

    const runner = this.pipelines.get(modelId);
    if (!runner) {
      throw new Error(`Model ${modelId} not initialized`);
    }

    const output = await runner(prompt, {
      max_new_tokens: 380,
      temperature: 0.45,
      do_sample: true,
    });

    return output[0]?.generated_text ?? '';
  }

  private async generateWithHf(modelId: string, prompt: string): Promise<string> {
    const token = process.env.HUGGING_FACE_TOKEN;
    if (!token) {
      return this.mockContent(prompt);
    }

    const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.5,
        },
      }),
    });

    const payload = (await response.json()) as Array<{ generated_text?: string }>;
    return payload?.[0]?.generated_text ?? this.mockContent(prompt);
  }

  private mockContent(prompt: string) {
    return `Blox AI draft:\n\n${prompt}\n\n- Tailored summary\n- ATS optimized bullets\n- SEO keyword enrichments`;
  }
}


