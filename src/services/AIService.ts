import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';

/**
 * AI Service - Abstract interface for AI integrations
 * Supports multiple providers: OpenAI, Claude, or local fallback
 */
export interface AIConfig {
    provider: 'openai' | 'claude' | 'local';
    apiKey?: string;
    model?: string;
    endpoint?: string;
}

export interface AIRequest {
    prompt: string;
    context?: string;
    maxTokens?: number;
    temperature?: number;
}

export interface AIResponse {
    content: string;
    tokensUsed?: number;
    model?: string;
}

export class AIService {
    private static _instance: AIService | undefined;
    private _config: AIConfig | null = null;

    private constructor() {}

    public static getInstance(): AIService {
        if (!AIService._instance) {
            AIService._instance = new AIService();
        }
        return AIService._instance;
    }

    /**
     * Initialize AI service with configuration
     */
    public async initialize(): Promise<void> {
        const config = vscode.workspace.getConfiguration('lamaworlds.ai');
        this._config = {
            provider: config.get('provider', 'local') as 'openai' | 'claude' | 'local',
            apiKey: config.get('apiKey'),
            model: config.get('model', 'gpt-4'),
            endpoint: config.get('endpoint')
        };
    }

    /**
     * Generate content using AI
     */
    public async generate(request: AIRequest): Promise<AIResponse> {
        if (!this._config) {
            await this.initialize();
        }

        switch (this._config!.provider) {
            case 'openai':
                return await this._callOpenAI(request);
            case 'claude':
                return await this._callClaude(request);
            case 'local':
            default:
                return await this._localFallback(request);
        }
    }

    /**
     * Call OpenAI API
     */
    private async _callOpenAI(request: AIRequest): Promise<AIResponse> {
        if (!this._config?.apiKey) {
            return this._localFallback(request);
        }

        const payload = JSON.stringify({
            model: this._config.model || 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a WPF XAML expert assistant.' },
                { role: 'user', content: request.prompt + (request.context ? `\n\nContext:\n${request.context}` : '') }
            ],
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this._config!.apiKey}`
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response.choices && response.choices[0]) {
                            resolve({
                                content: response.choices[0].message.content,
                                tokensUsed: response.usage?.total_tokens,
                                model: response.model
                            });
                        } else {
                            reject(new Error('Invalid response from OpenAI'));
                        }
                    } catch (error: any) {
                        reject(error);
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.write(payload);
            req.end();
        });
    }

    /**
     * Call Claude API
     */
    private async _callClaude(request: AIRequest): Promise<AIResponse> {
        if (!this._config?.apiKey) {
            return this._localFallback(request);
        }

        // Similar implementation for Claude
        // For now, fallback to local
        return this._localFallback(request);
    }

    /**
     * Local fallback - rule-based generation
     */
    private async _localFallback(request: AIRequest): Promise<AIResponse> {
        // Rule-based generation as fallback
        let content = '';

        if (request.prompt.toLowerCase().includes('button')) {
            content = '<Button Content="Click Me" Style="{StaticResource NeonButton}" />';
        } else if (request.prompt.toLowerCase().includes('grid')) {
            content = '<Grid>\n    <Grid.RowDefinitions>\n        <RowDefinition Height="*" />\n    </Grid.RowDefinitions>\n</Grid>';
        } else if (request.prompt.toLowerCase().includes('textbox')) {
            content = '<TextBox Text="{Binding TextProperty}" Margin="10" />';
        } else {
            content = '<!-- Generated XAML based on your description -->\n<Grid>\n    <!-- Add your content here -->\n</Grid>';
        }

        return {
            content,
            model: 'local-fallback'
        };
    }

    /**
     * Check if AI service is available
     */
    public isAvailable(): boolean {
        return this._config?.provider !== 'local' && !!this._config?.apiKey;
    }
}

