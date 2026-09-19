/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, expect, it, vi } from 'vitest';
import type { Config } from '../../../config/config.js';
import type { ContentGeneratorConfig } from '../../contentGenerator.js';
import { determineProvider } from '../index.js';
import { DefaultOpenAICompatibleProvider } from './default.js';
import { DeepSeekOpenAICompatibleProvider } from './deepseek.js';

function createCliConfig(): Config {
  return {
    getCliVersion: vi.fn().mockReturnValue('1.0.0'),
    getProxy: vi.fn().mockReturnValue(undefined),
  } as unknown as Config;
}

function createProviderConfig(
  overrides: Partial<ContentGeneratorConfig>,
): ContentGeneratorConfig {
  return {
    apiKey: 'ionet-test-key',
    baseUrl: 'https://api.intelligence.io.solutions/api/v1',
    model: 'zai-org/GLM-5.3',
    ...overrides,
  } as ContentGeneratorConfig;
}

describe('IO Intelligence provider selection', () => {
  // IO Intelligence serves a standard OpenAI-compatible API, so it
  // intentionally has no bespoke handler. These tests guard against a future
  // name/host matcher accidentally capturing the IO Intelligence endpoint
  // and mutating its otherwise-standard requests. DeepSeek-hosted model ids
  // are the documented exception: the generic DeepSeek model-name heuristic
  // (see provider/deepseek.ts) applies DeepSeek's text-only content
  // handling wherever a deepseek-named model is served, including
  // third-party catalogs like this one — but the host-gated wire rewrites
  // stay off the IO Intelligence host.
  it('resolves the IO Intelligence endpoint to the default OpenAI-compatible provider', () => {
    const provider = determineProvider(
      createProviderConfig({}),
      createCliConfig(),
    );
    expect(provider.constructor).toBe(DefaultOpenAICompatibleProvider);
  });

  it.each([
    'zai-org/GLM-5.3',
    'zai-org/GLM-4.6',
    'moonshotai/Kimi-K3',
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'meta-llama/Llama-3.3-70B-Instruct',
    'moonshotai/Kimi-K2-Instruct-0905',
  ])(
    'uses the default provider for %s (strict class, no subclass)',
    (model) => {
      const provider = determineProvider(
        createProviderConfig({ model }),
        createCliConfig(),
      );
      expect(provider.constructor).toBe(DefaultOpenAICompatibleProvider);
    },
  );

  it.each([
    'deepseek-ai/DeepSeek-V4.1-Flash',
    'deepseek-ai/DeepSeek-V4-Pro',
    'deepseek-ai/DeepSeek-V3.2',
  ])(
    'routes %s through the DeepSeek-compatible handler (model-name heuristic)',
    (model) => {
      const provider = determineProvider(
        createProviderConfig({ model }),
        createCliConfig(),
      );
      expect(provider).toBeInstanceOf(DeepSeekOpenAICompatibleProvider);
    },
  );

  it('leaves outgoing requests unchanged for non-DeepSeek models (no provider-specific rewriting)', () => {
    const provider = determineProvider(
      createProviderConfig({}),
      createCliConfig(),
    );
    const request = {
      model: 'zai-org/GLM-5.3',
      messages: [
        { role: 'user' as const, content: 'Say OK' },
        {
          role: 'assistant' as const,
          content: [{ type: 'text' as const, text: 'OK' }],
        },
      ],
      max_tokens: 100,
    };
    const result = provider.buildRequest(request, 'prompt-123');
    expect(result).toEqual(request);
  });

  it('does not apply DeepSeek host-gated wire rewrites on the IO Intelligence host', () => {
    const provider = determineProvider(
      createProviderConfig({ model: 'deepseek-ai/DeepSeek-V3.2' }),
      createCliConfig(),
    );
    const request = {
      model: 'deepseek-ai/DeepSeek-V3.2',
      messages: [{ role: 'user' as const, content: 'Say OK' }],
      reasoning: { effort: 'max' },
    };
    const result = provider.buildRequest(
      request as unknown as Parameters<typeof provider.buildRequest>[0],
      'prompt-123',
    ) as unknown as Record<string, unknown>;
    // The flat `reasoning_effort` translation and the `thinking` parameter
    // are only valid on api.deepseek.com; they must not leak onto the
    // IO Intelligence endpoint. The nested `reasoning` object survives as
    // an object (the default provider may normalise the effort tier).
    expect(result['reasoning_effort']).toBeUndefined();
    expect(result['thinking']).toBeUndefined();
    expect(typeof result['reasoning']).toBe('object');
    expect(result['reasoning']).toHaveProperty('effort');
  });
});
