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
    model: 'deepseek-ai/DeepSeek-V3.2',
    ...overrides,
  } as ContentGeneratorConfig;
}

describe('IO Intelligence provider selection', () => {
  // IO Intelligence serves a standard OpenAI-compatible API, so it
  // intentionally has no bespoke handler. These tests guard against a future
  // name/host matcher accidentally capturing IO Intelligence and mutating its
  // otherwise-standard requests.
  it('resolves the IO Intelligence endpoint to the default OpenAI-compatible provider', () => {
    const provider = determineProvider(
      createProviderConfig({}),
      createCliConfig(),
    );
    expect(provider).toBeInstanceOf(DefaultOpenAICompatibleProvider);
  });

  it.each([
    'deepseek-ai/DeepSeek-V4.1-Flash',
    'zai-org/GLM-5.3',
    'moonshotai/Kimi-K3',
    'openai/gpt-oss-120b',
    'meta-llama/Llama-3.3-70B-Instruct',
  ])('uses the default provider for %s', (model) => {
    const provider = determineProvider(
      createProviderConfig({ model }),
      createCliConfig(),
    );
    expect(provider).toBeInstanceOf(DefaultOpenAICompatibleProvider);
  });

  it('leaves outgoing requests unchanged (no provider-specific rewriting)', () => {
    const provider = determineProvider(
      createProviderConfig({}),
      createCliConfig(),
    );
    const request = {
      model: 'deepseek-ai/DeepSeek-V3.2',
      messages: [{ role: 'user' as const, content: 'Say OK' }],
      max_tokens: 100,
    };
    const result = provider.buildRequest(request, 'prompt-123');
    expect(result).toEqual(request);
  });
});
