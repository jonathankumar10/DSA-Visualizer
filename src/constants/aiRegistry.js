// ── AI Registry ───────────────────────────────────────────────────────────────
// All AI learning topics defined inline.
// Categories: history | ml | llms | workflows | agents | production

export const AI_CATEGORY_LABELS = {
  history:    'History & Foundations',
  ml:         'Core ML',
  llms:       'LLMs & Transformers',
  workflows:  'AI Workflows',
  agents:     'AI Agents',
  production: 'Production & Evaluation',
}

export const AI_COLORS = {
  violet:  { text: 'text-violet-300', bg: 'bg-violet-500/10', border: 'border-violet-500/25', badgeBg: 'bg-violet-500/15', badgeBorder: 'border-violet-500/30', dot: 'bg-violet-400', glow: '#8b5cf6' },
  sky:     { text: 'text-sky-300',    bg: 'bg-sky-500/10',    border: 'border-sky-500/25',    badgeBg: 'bg-sky-500/15',    badgeBorder: 'border-sky-500/30',    dot: 'bg-sky-400',    glow: '#0ea5e9' },
  amber:   { text: 'text-amber-300',  bg: 'bg-amber-500/10',  border: 'border-amber-500/25',  badgeBg: 'bg-amber-500/15',  badgeBorder: 'border-amber-500/30',  dot: 'bg-amber-400',  glow: '#f59e0b' },
  teal:    { text: 'text-teal-300',   bg: 'bg-teal-500/10',   border: 'border-teal-500/25',   badgeBg: 'bg-teal-500/15',   badgeBorder: 'border-teal-500/30',   dot: 'bg-teal-400',   glow: '#14b8a6' },
  emerald: { text: 'text-emerald-300',bg: 'bg-emerald-500/10',border: 'border-emerald-500/25',badgeBg: 'bg-emerald-500/15',badgeBorder: 'border-emerald-500/30',dot: 'bg-emerald-400',glow: '#10b981' },
  blue:    { text: 'text-blue-300',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   badgeBg: 'bg-blue-500/15',   badgeBorder: 'border-blue-500/30',   dot: 'bg-blue-400',   glow: '#3b82f6' },
  rose:    { text: 'text-rose-300',   bg: 'bg-rose-500/10',   border: 'border-rose-500/25',   badgeBg: 'bg-rose-500/15',   badgeBorder: 'border-rose-500/30',   dot: 'bg-rose-400',   glow: '#f43f5e' },
  indigo:  { text: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25', badgeBg: 'bg-indigo-500/15', badgeBorder: 'border-indigo-500/30', dot: 'bg-indigo-400', glow: '#6366f1' },
}

export const AI_ITEMS = [
  // ── History & Foundations ────────────────────────────────────────────────────
  {
    id:       'ai-history',
    category: 'history',
    title:    'The History of AI',
    color:    'amber',
    tagline:  'From Turing\'s vision to the deep learning revolution',
    description:
      'AI has a history spanning over 70 years — punctuated by periods of explosive optimism, brutal funding winters, and unexpected breakthroughs. Understanding this arc gives context to why modern deep learning emerged when it did and why past failures happened.',
    howItWorks: [
      '1950 — Alan Turing publishes "Computing Machinery and Intelligence", proposing the Imitation Game as a test for machine intelligence.',
      '1956 — The Dartmouth Conference coins the term "Artificial Intelligence". Researchers predict human-level AI within 20 years.',
      '1970s–80s — First AI winter: results fell far short of promises, leading to massive funding cuts from governments and industry.',
      '1980s — Expert systems briefly revive AI interest, encoding human knowledge as hand-crafted rules. The second winter follows when they prove too brittle.',
      '2012 — AlexNet wins the ImageNet challenge by a huge margin using deep convolutional networks on GPUs, igniting the modern deep learning era.',
      '2017 — "Attention Is All You Need" introduces the Transformer architecture, which becomes the foundation of every major LLM — GPT, BERT, Gemini, and beyond.',
    ],
    keyPoints: [
      'AI has gone through at least two "winters" where funding dried up after overpromised results — hype cycles are a recurring pattern.',
      'Deep learning\'s 2012 breakthrough required three things aligning: large datasets (ImageNet), powerful GPUs, and improved training techniques.',
      'The Transformer (2017) is arguably the most influential ML paper of the decade — nearly all frontier AI today builds on it.',
      'Modern AI is powerful pattern matching at massive scale — it does not reason the way humans do.',
      'The distinction: AI is the broad field; ML is learning from data; deep learning is ML using deep neural networks.',
    ],
    interviewAngles: [
      'What is the difference between AI, machine learning, and deep learning?',
      'Why did deep learning succeed in the 2010s when earlier neural networks had failed?',
      'What is the Turing test, and why do modern researchers largely move past it?',
      'What caused the AI winters, and could another one happen?',
    ],
  },

  // ── Core ML ──────────────────────────────────────────────────────────────────
  {
    id:       'neural-networks',
    category: 'ml',
    title:    'Neural Networks',
    color:    'blue',
    tagline:  'Layers of weighted connections that learn by example',
    description:
      'A neural network is a stack of layers, each transforming its input into a richer representation. By repeatedly adjusting connection weights to reduce prediction error, the network learns to recognise patterns — without being explicitly programmed with rules.',
    howItWorks: [
      'The input layer receives raw features: pixel values, word embeddings, or sensor readings.',
      'Each neuron in a hidden layer computes a weighted sum of its inputs, adds a bias term, then passes the result through a nonlinear activation function (e.g. ReLU).',
      'Multiple hidden layers progressively extract higher-level features — early layers detect edges, later layers detect shapes, the final layers detect objects.',
      'The output layer produces predictions: class probabilities (softmax) for classification, or a continuous value for regression.',
      'A loss function measures how wrong the predictions are — cross-entropy for classification, MSE for regression.',
      'Backpropagation uses the chain rule to compute gradients; gradient descent updates every weight in the direction that reduces loss.',
    ],
    keyPoints: [
      'Depth (more layers) allows hierarchical feature learning — each layer builds on the previous one.',
      'Activation functions (ReLU, sigmoid, tanh) give networks the ability to model non-linear relationships; without them, stacking layers is mathematically identical to one layer.',
      'Overfitting means the network memorised training data instead of generalising — addressed with dropout, regularisation, and more data.',
      'Vanishing gradients in deep networks make training hard; ReLU activations and residual connections (skip connections) are the standard fix.',
    ],
    interviewAngles: [
      'What is the role of the activation function? Why is ReLU preferred over sigmoid in hidden layers?',
      'What is the vanishing gradient problem, and how do residual connections address it?',
      'Walk me through a complete forward pass and backward pass for a simple network.',
      'What is the difference between batch, mini-batch, and stochastic gradient descent?',
    ],
  },
  {
    id:       'training-and-loss',
    category: 'ml',
    title:    'Training & Loss',
    color:    'emerald',
    tagline:  'How a model learns by measuring and shrinking its mistakes',
    description:
      'Training is the iterative process of adjusting a model\'s parameters so its predictions get closer to the correct answers. The loss function quantifies how wrong the model is; gradient descent is the algorithm that moves parameters in the direction that reduces loss.',
    howItWorks: [
      'Initialise all weights randomly (or with a smart scheme like Xavier/He initialisation).',
      'Forward pass: feed a batch of training examples through the network and compute predictions.',
      'Compute the loss: compare predictions to true labels using a loss function (cross-entropy or MSE).',
      'Backward pass: apply the chain rule to compute the gradient of the loss with respect to every weight.',
      'Weight update: move each weight a small step opposite to its gradient — the step size is the learning rate.',
      'Repeat for many batches across many epochs; monitor validation loss to detect overfitting and stop early if needed.',
    ],
    keyPoints: [
      'The learning rate is the most critical hyperparameter — too high causes divergence, too low means training never converges.',
      'Mini-batch gradient descent (16–512 samples per batch) balances computational efficiency with gradient quality.',
      'Regularisation techniques (dropout, L2 weight decay, early stopping) combat overfitting.',
      'The train/validation/test split is essential: train on one set, tune hyperparameters on another, report final metrics on the held-out test set.',
      'Adam optimiser combines adaptive learning rates with momentum — it is the default starting point for most modern training runs.',
    ],
    interviewAngles: [
      'What is the difference between gradient descent, SGD, and Adam?',
      'Why do we need a validation set in addition to a test set?',
      'What is overfitting and what are three techniques to prevent it?',
      'What happens if the learning rate is too large? Too small?',
    ],
  },

  // ── LLMs & Transformers ───────────────────────────────────────────────────────
  {
    id:       'transformer-architecture',
    category: 'llms',
    title:    'The Transformer',
    color:    'violet',
    tagline:  'The architecture behind every modern LLM',
    description:
      'The Transformer replaced recurrent networks for sequence modelling by processing all tokens in parallel using self-attention. Introduced in "Attention Is All You Need" (Vaswani et al., 2017), it became the foundation of BERT, GPT, and every major language model today.',
    howItWorks: [
      'Input text is split into tokens and each token is converted to a dense embedding vector.',
      'Positional encodings are added to the embeddings to give the model a sense of token order — since attention itself is permutation-invariant.',
      'Each Transformer block runs multi-head self-attention: every token simultaneously attends to every other token to gather context.',
      'A position-wise feed-forward network then processes each token\'s attended representation independently.',
      'Residual connections (skip connections) and layer normalisation wrap each sub-layer, enabling stable training of very deep stacks.',
      'Encoder-only models (BERT) process the full sequence bidirectionally; decoder-only models (GPT) generate token-by-token with causal masking.',
    ],
    keyPoints: [
      'Self-attention has O(n²) computational complexity with sequence length — a key scalability challenge for very long contexts.',
      '"Multi-head" means running attention in parallel with different learned projections, each capturing different linguistic relationships.',
      'Pre-training on a massive text corpus followed by fine-tuning (or prompting) on a specific task is the standard recipe.',
      'The Transformer parallelises perfectly across GPU cores — this is the key reason scale works so well.',
    ],
    interviewAngles: [
      'What is the difference between encoder-only, decoder-only, and encoder-decoder Transformers? Give an example of each.',
      'Why can\'t Transformers handle infinitely long sequences without modification?',
      'How does positional encoding convey order when attention itself is permutation-invariant?',
      'What is the computational bottleneck of the Transformer at long contexts?',
    ],
  },
  {
    id:       'attention-mechanism',
    category: 'llms',
    title:    'The Attention Mechanism',
    color:    'indigo',
    tagline:  'Every token learns which other tokens matter for understanding it',
    description:
      'Attention lets each position in a sequence look at all other positions and decide how much to "attend" to each one. It is the core innovation that makes Transformers powerful — instead of compressing context into a fixed vector, attention directly weights every relevant piece.',
    howItWorks: [
      'For each token, three vectors are computed via learned linear projections: Query (Q), Key (K), and Value (V).',
      'The Query represents "what am I looking for?" and each Key represents "what information do I contain?"',
      'Dot products between the Query and all Keys produce raw attention scores — a high score means high relevance.',
      'Scores are scaled by dividing by √d_k (the key dimension) to prevent softmax saturation in high dimensions, then passed through softmax to produce weights.',
      'The final output is a weighted sum of all Value vectors, using the softmax weights — semantically: borrow information proportionally from relevant tokens.',
      'Multi-head attention runs this entire process in parallel H times with different learned projections, then concatenates the results.',
    ],
    keyPoints: [
      'The formula: Attention(Q, K, V) = softmax(QK^T / √d_k) × V',
      'Long-range dependencies are captured trivially — unlike RNNs, there is no distance-based vanishing gradient.',
      'Masked (causal) attention prevents tokens from attending to future positions during autoregressive generation.',
      'Cross-attention (used in encoder-decoder models) lets one sequence attend to a different sequence — e.g., a translation query attending to the source sentence.',
    ],
    interviewAngles: [
      'Why do we scale by √d_k before the softmax?',
      'What is the difference between self-attention and cross-attention?',
      'What is the computational complexity of self-attention? How does it scale with sequence length?',
      'What does "multi-head" add over single-head attention?',
    ],
  },

  // ── LLMs & Transformers (continued) ─────────────────────────────────────────
  {
    id:       'tokenization',
    category: 'llms',
    title:    'Tokenization',
    color:    'amber',
    tagline:  'How raw text becomes the units an LLM actually reads',
    description:
      'LLMs do not operate on characters or words — they operate on tokens, subword units produced by a tokenizer trained alongside the model. Understanding tokenization explains why LLMs struggle with character counting, fail on unusual words, and cost money proportional to token count rather than word count.',
    howItWorks: [
      'The tokenizer scans the training corpus and learns a vocabulary of 50k–130k subword pieces using Byte-Pair Encoding (BPE) or Unigram LM. BPE starts with individual bytes, then repeatedly merges the most frequent adjacent pair into a new token until the target vocabulary size is reached.',
      'At inference time, raw text is split into the longest matching tokens from the vocabulary — producing a sequence of integer IDs that the model\'s embedding layer looks up to get dense vectors.',
      'Common English words typically map to a single token; rare words, misspellings, and non-English text split into many tokens. "Unforgettable" → 1 token; "Ünforgêttable" → 8+ tokens.',
      'Special tokens frame the conversation: <|system|>, <|user|>, <|assistant|>, <|endoftext|> signal role boundaries and sequence termination. These are injected by the model\'s chat template, not by your prompt.',
      'The model generates one token at a time — sampling from the probability distribution over the entire vocabulary until it produces an end-of-sequence token or hits max_tokens.',
      'Different models use different tokenizers with different vocabulary boundaries — a prompt that fits in GPT-4\'s 128k context may not fit Claude\'s due to different tokenization of the same text.',
    ],
    keyPoints: [
      'Token count ≠ word count — expect roughly 1.3–1.5 tokens per English word, more for code, JSON, and non-Latin scripts',
      'Tokenization explains LLM "blindspots": counting characters, reversing strings, and spotting rhymes all require character-level access that tokenization obscures',
      'API pricing is per token (input + output) — tokenization directly drives your bill. OpenAI\'s tokenizer playground lets you estimate costs before building',
      'GPT-4 uses the cl100k_base tokenizer (~100k vocab); Llama 3 uses ~128k; different boundaries mean the same text produces different token counts across models',
    ],
    interviewAngles: [
      'Why can\'t LLMs easily count the number of "r"s in "strawberry"?',
      'What is BPE and why is it used instead of splitting on whitespace?',
      'How does tokenization affect cost estimation for an LLM application?',
      'What are special tokens and why do they matter for chat models?',
    ],
  },
  {
    id:       'context-windows',
    category: 'llms',
    title:    'Context Windows',
    color:    'sky',
    tagline:  'The model\'s working memory — everything it can see at once',
    description:
      'A context window is the total number of tokens a model can process in a single forward pass — its entire input (system prompt, history, retrieved docs, tool outputs) combined. Text beyond the limit is simply not seen. Context window management is one of the most practical engineering challenges when building LLM-powered applications.',
    howItWorks: [
      'Every LLM call receives the full context — system prompt, conversation history, retrieved documents, tool outputs — all concatenated into one token sequence before the model processes any of it.',
      'The attention mechanism computes relationships between every token pair: this is why context limits exist. Attention is O(n²) in sequence length, so doubling context quadruples compute.',
      'Modern models have pushed limits from 4k tokens (GPT-3) to 128k (GPT-4 Turbo) and beyond (Gemini 1.5 Pro at 1M tokens). The KV-cache stores attention keys/values for already-processed tokens, making subsequent generation cheaper but still charging for full input tokens on every call.',
      '"Lost in the middle" — research shows model attention degrades for information in the middle of very long contexts. Models attend strongest to the beginning (system prompt) and end (most recent message). Put critical instructions at the start and repeat them before the final user turn.',
      'Strategies for long content: chunking (split docs into segments for RAG), sliding window (drop oldest turns as conversation grows), summarization (compress old turns into a running summary), and hierarchical RAG (retrieve only relevant chunks rather than injecting full documents).',
      'Context matters for cost: most providers charge per input token on every call. A 100k-token context window costs 25× more per call than 4k — even when only a handful of new tokens were added in the latest turn.',
    ],
    keyPoints: [
      'The context window is not memory — the model has no state between API calls. Every call starts fresh; all context must be re-sent every time',
      '"Lost in the middle" is a real reliability issue — place the most important instructions in the system prompt and repeat critical constraints immediately before the final user message',
      'KV-cache makes sequential token generation fast, but prompt caching (Anthropic, OpenAI) is a separate feature that lets providers re-use cached prefix tokens, reducing both latency and cost for repeated system prompts',
      'Larger context windows increase cost and latency proportionally — do not default to maximum context. Use RAG to retrieve only what is relevant rather than injecting entire knowledge bases',
    ],
    interviewAngles: [
      'What happens when a conversation exceeds the context window?',
      'How would you handle a 50-page document that needs to be processed by an LLM?',
      'What is the "lost in the middle" problem and how do you mitigate it in production?',
      'Why does a larger context window make each API call more expensive even for short new messages?',
    ],
  },
  {
    id:       'llm-inference',
    category: 'llms',
    title:    'LLM Inference & Sampling',
    color:    'emerald',
    tagline:  'How temperature, top-p, and top-k control what the model says next',
    description:
      'LLMs generate text by predicting one token at a time, sampling from a probability distribution over the entire vocabulary. The sampling strategy dramatically affects output quality: temperature controls randomness, top-p and top-k limit the candidate pool, and greedy decoding picks the single most likely token. Understanding these parameters lets you tune models for deterministic reliability or creative diversity.',
    howItWorks: [
      'At each generation step, the model\'s final layer produces logits — raw unnormalized scores over every token in the vocabulary (50k–130k values). Higher logits mean higher predicted probability for that token.',
      'Temperature scales the logits before softmax: T=1.0 gives the model\'s raw distribution; T<1 (e.g., 0.2) sharpens it, making the most likely token overwhelmingly dominant; T>1 flattens it, increasing randomness and creativity.',
      'Top-k sampling restricts sampling to the k most probable tokens (e.g., k=40). All tokens outside the top-k are zeroed before sampling, preventing very unlikely tokens from ever being chosen regardless of temperature.',
      'Top-p (nucleus) sampling is adaptive: include the smallest set of tokens whose cumulative probability exceeds p (e.g., 0.9). When one token dominates, the candidate pool shrinks; when probabilities are spread out, it expands. More robust than top-k across diverse prompts.',
      'Greedy decoding always picks the single highest-probability token. Fast and deterministic but often produces repetitive, locally-optimal text that loops or plateau-states on complex tasks. Setting temperature near 0 approximates greedy.',
      'Max tokens (max_completion_tokens) sets a hard output length cap — the model stops at this limit even mid-sentence. Never use it as a safety valve for cost; cost is in the input. Use it to enforce conciseness in structured output tasks.',
    ],
    keyPoints: [
      'Temperature=0 for factual, deterministic tasks (code generation, structured extraction); temperature 0.7–1.0 for creative writing and brainstorming',
      'Top-p=0.9 and top-k=40 are common production defaults — they prevent nonsensical tokens while preserving meaningful variety',
      'Setting temperature > 0 makes responses non-deterministic — identical prompts produce different outputs. Use temperature=0 in eval pipelines to get reproducible results',
      'Time-to-first-token (TTFT) is the latency users feel most acutely. Streaming responses (server-sent events) lets you display tokens as they are generated rather than waiting for the full completion',
    ],
    interviewAngles: [
      'What does temperature do to LLM output? When would you use low vs. high temperature?',
      'What is the difference between top-k and top-p sampling? Which is more robust?',
      'Why is greedy decoding often a poor choice for long-form generation?',
      'What is time-to-first-token and why does it matter for user experience?',
    ],
  },
  {
    id:       'multimodal-models',
    category: 'llms',
    title:    'Multimodal Models',
    color:    'indigo',
    tagline:  'Models that see, hear, and generate across text, images, and audio',
    description:
      'Multimodal AI models process and generate content across multiple data types — text, images, audio, and video — within a unified architecture. Vision-language models like GPT-4o, Claude 3, and Gemini answer questions about images, extract structured data from documents, and describe visual content. Separate generative models produce images, speech, and video from text prompts.',
    howItWorks: [
      'Vision-language models add an image encoder (typically a Vision Transformer — ViT) to the standard LLM. The image is split into fixed-size patches, each patch encoded into an embedding vector, and these image embeddings are concatenated with text token embeddings before the transformer processes them together.',
      'For document understanding, the model receives an image of a scanned page and outputs structured text — useful for invoices, contracts, and forms that cannot be reliably parsed with traditional OCR alone, since the model understands layout and context.',
      'Text-to-image models (DALL-E 3, Stable Diffusion, Midjourney) use diffusion — starting from random noise and iteratively denoising toward an image that matches the text prompt. CLIP aligns text and image embeddings in a shared vector space, letting the denoising process steer toward semantically matching images.',
      'Speech-to-text models (Whisper) convert audio waveforms to spectrograms, encode them as sequence embeddings, then autoregressively decode the transcript. Text-to-speech models reverse this: predict mel-spectrogram frames from text, then convert to audio with a neural vocoder.',
      'Native multimodality vs. pipeline: early systems chained separate models (OCR → text → LLM). Native multimodal models (GPT-4o, Gemini) process raw pixels and audio end-to-end, enabling richer cross-modal reasoning rather than cascading errors from one model to the next.',
      'Current limitations: vision models hallucinate image content — they describe objects not present. They struggle with precise spatial reasoning ("is the red box left or right of the blue circle?"). Image generation cannot reliably render text within images.',
    ],
    keyPoints: [
      'Vision-language models unlock document AI at scale: extract structured fields from invoices, PDFs, and screenshots without custom OCR + rule-based parsing pipelines',
      'CLIP embeddings make images and text comparable in the same vector space — used in semantic image search ("find photos of rainy city streets") without requiring keyword metadata on every image',
      'GPT-4o is natively multimodal — it processes tokens from all modalities in a single model rather than routing through separate specialized models stitched together',
      'For image generation, descriptive prompts outperform short ones. Negative prompts tell diffusion models what to exclude — "no text overlay, no watermarks" improves output quality significantly',
    ],
    interviewAngles: [
      'How does a vision-language model combine image understanding with text generation?',
      'What is CLIP and what made it foundational for multimodal AI?',
      'When would you use a vision model instead of a traditional OCR pipeline?',
      'What are the current limitations of multimodal models for production document processing?',
    ],
  },

  // ── AI Workflows ─────────────────────────────────────────────────────────────
  {
    id:       'prompt-engineering',
    category: 'workflows',
    title:    'Prompt Engineering',
    color:    'sky',
    tagline:  'Craft inputs that reliably produce the outputs you need',
    description:
      'Prompt engineering is the practice of designing inputs to an LLM to reliably elicit high-quality, correct outputs. Because LLMs are highly sensitive to phrasing, context, and structure, well-crafted prompts can dramatically outperform naive ones — often closing the gap between a fine-tuned model and a general one.',
    howItWorks: [
      'Zero-shot: simply describe the task in plain language and let the model infer the format and approach from its training.',
      'Few-shot: provide 2–5 worked examples in the prompt; the model continues the pattern with impressive accuracy on structured tasks.',
      'Chain-of-thought (CoT): add "think step by step" or show step-by-step reasoning examples; forces explicit intermediate steps and significantly improves accuracy on reasoning tasks.',
      'System / user / assistant roles: separate long-term instructions (system), the user\'s request, and the model\'s previous turn — keeping context clean and consistent.',
      'Structured output: use JSON mode, tool calling, or XML tags to constrain the model to machine-readable formats.',
      'Temperature and top-p: lower temperature (0.1–0.3) for deterministic factual answers; higher (0.7–1.0) for creative generation.',
    ],
    keyPoints: [
      'Models are stateless between API calls — all context must be re-supplied in every request.',
      'Chain-of-thought prompting can turn a wrong answer into a correct one on math, logic, and multi-step reasoning tasks.',
      'Telling the model "say I don\'t know if you\'re uncertain" measurably reduces hallucinations.',
      'Token limits are hard constraints — very long prompts can silently truncate important context (or fail entirely).',
      'Prompt injection: malicious input that hijacks the model\'s instructions is a real security concern in user-facing apps.',
    ],
    interviewAngles: [
      'What is the difference between zero-shot, few-shot, and chain-of-thought prompting?',
      'How would you reduce hallucinations in an LLM-powered product?',
      'What is a system prompt and why does it matter for production AI apps?',
      'How would you evaluate whether one prompt is better than another?',
    ],
  },
  {
    id:       'rag',
    category: 'workflows',
    title:    'Retrieval-Augmented Generation',
    color:    'teal',
    tagline:  'Ground LLM answers in retrieved, up-to-date documents',
    description:
      'RAG solves two fundamental LLM limitations — hallucination and knowledge cutoffs — by fetching relevant documents at query time and injecting them into the prompt. The model answers based on retrieved facts rather than relying solely on memorised training data.',
    howItWorks: [
      'Offline: a document corpus is chunked (split into ~300–500 token segments), each chunk is encoded by an embedding model into a dense vector.',
      'Vectors are stored in a vector database (Pinecone, pgvector, Weaviate, Chroma) indexed for fast approximate nearest-neighbour search.',
      'At query time, the user\'s question is embedded with the same model to produce a query vector.',
      'The vector DB retrieves the top-k chunks whose embeddings are most similar (cosine similarity) to the query vector.',
      'Retrieved chunks are prepended to the user\'s question in the LLM prompt as grounding context.',
      'The LLM generates an answer based on the retrieved facts — with citations if prompted to do so.',
    ],
    keyPoints: [
      'RAG decouples retrieval from generation — you can swap either component independently.',
      'Chunking strategy (size, overlap) and embedding model quality are the biggest determinants of retrieval accuracy.',
      'Reranking (a second, more accurate model that re-orders the top-k) can significantly improve precision at the cost of latency.',
      'RAG does not eliminate hallucination — the LLM can still misread or "extend" retrieved docs beyond what they say.',
      'RAG vs. fine-tuning: RAG for fresh or proprietary data; fine-tuning for style, tone, or task-specific behaviour the model needs to exhibit consistently.',
    ],
    interviewAngles: [
      'When would you use RAG versus fine-tuning? What are the trade-offs?',
      'How would you evaluate the quality of a RAG pipeline end to end?',
      'What is a vector database and how does approximate nearest-neighbour search work?',
      'What are common failure modes in RAG systems?',
    ],
  },
  {
    id:       'embeddings',
    category: 'workflows',
    title:    'Embeddings & Vector Search',
    color:    'rose',
    tagline:  'Represent meaning as a point in high-dimensional space',
    description:
      'An embedding is a dense vector that captures the semantic meaning of text (or images, audio, code, etc.). Similar concepts cluster together in embedding space — "king" and "queen" are nearby; "dog" and "cat" are closer to each other than to "car". Embeddings power semantic search, RAG, recommendation, and classification.',
    howItWorks: [
      'A trained encoder model (e.g. text-embedding-ada-002, BGE, E5) takes raw text as input.',
      'The text is tokenised and run through the encoder\'s attention layers.',
      'The encoder\'s final hidden state (or a mean-pooled version across all tokens) is the embedding — a fixed-length vector of 768, 1536, or 3072 floats.',
      'Semantically similar texts produce vectors that point in similar directions in this high-dimensional space.',
      'Embedding models are trained with contrastive learning: positive pairs (similar texts) are pulled together; negative pairs (dissimilar) are pushed apart.',
      'At search time, the query is embedded; approximate nearest-neighbour (ANN) algorithms (HNSW, IVF) find the closest stored vectors in milliseconds.',
    ],
    keyPoints: [
      'Cosine similarity (dot product of unit-normalised vectors) is the standard metric — it measures the angle between vectors, not their magnitude.',
      'Embeddings capture semantic meaning, not string similarity — "happy" and "joyful" have very high cosine similarity even though they share no characters.',
      'Embedding dimension affects quality vs. storage cost — larger dims encode more nuance but need more memory and are slower to search.',
      'Domain shift matters: embeddings trained on general web text may perform poorly on code, medical text, or legal language — use domain-specific models.',
    ],
    interviewAngles: [
      'How are text embeddings generated? What is the difference between a sentence transformer and a word embedding (Word2Vec)?',
      'What is the difference between cosine similarity and Euclidean distance for comparing embeddings?',
      'How would you build a semantic search system from scratch? Walk me through each component.',
      'What is approximate nearest-neighbour search and why is it used instead of exact search?',
    ],
  },
  {
    id:       'function-calling',
    category: 'workflows',
    title:    'Function Calling & Tool Use',
    color:    'teal',
    tagline:  'Give LLMs the ability to take actions, not just answer questions',
    description:
      'Function calling (tool use) allows LLMs to request the execution of predefined functions — web search, database queries, API calls, code execution — during generation. The model decides which tool to invoke and with what arguments; your application executes it and returns the result. This transforms an LLM from a text predictor into an agent that can interact with live systems.',
    howItWorks: [
      'The developer defines tools as JSON schemas — each specifies a function name, description, and parameter types. These schemas are passed to the model alongside the conversation (via a structured tools parameter, not embedded in the prompt).',
      'When generating a response, the model can emit a tool_call instead of prose — specifying which function to invoke and what arguments to pass, structured as JSON matching the schema.',
      'The application intercepts the tool_call, executes the actual function (querying a database, calling a weather API, running code), and appends the result as a tool_result message in the conversation.',
      'The model resumes generation with the tool output in context, producing a final user-facing response that incorporates the retrieved or computed data. Multiple round-trips are possible for multi-step tasks.',
      'Parallel tool calling: models can emit multiple tool_calls in a single turn when tools can run simultaneously. The application executes them in parallel and returns all results, reducing latency compared to sequential calls.',
      'Structured outputs (JSON mode): instead of tool calling, constrain the model to emit valid JSON matching a specified schema on every response. Used for data extraction, classification, and any pipeline that needs machine-parseable output rather than prose.',
    ],
    keyPoints: [
      'Tool descriptions are prompt-engineering — the model decides which tool to call based on your description. Vague or overlapping descriptions cause wrong tool selection. Write them as if documenting an API for a senior colleague',
      'Function calling is the mechanism behind AI assistants that browse the web, run code, and call APIs — the model orchestrates; your application executes. All security controls (auth, rate limiting, input sanitization) live on the execution side',
      'Structured outputs via JSON mode are more reliable than asking the model to "output JSON" in a regular prompt — they constrain token generation to only valid JSON, preventing malformed output that breaks downstream parsing',
      'Tool schemas define what the model can request, not what it can access — never trust model-generated arguments without validation. An adversarial prompt can craft tool arguments designed to exploit your function',
    ],
    interviewAngles: [
      'How does function calling work at the API level? What does the conversation look like before and after a tool call?',
      'What is the difference between function calling and structured output (JSON mode)?',
      'How would you design the tool schemas for a customer support agent that can look up orders, issue refunds, and escalate tickets?',
      'What security considerations arise when an LLM can invoke external functions?',
    ],
  },
  {
    id:       'fine-tuning',
    category: 'workflows',
    title:    'Fine-Tuning',
    color:    'violet',
    tagline:  'Adapt a pre-trained model to your specific task or style',
    description:
      'Fine-tuning updates a pre-trained model\'s weights on a curated task-specific dataset, improving performance on narrow domains without training from scratch. Modern parameter-efficient methods (LoRA, QLoRA) make fine-tuning feasible on a single GPU, while instruction fine-tuning teaches models to follow specific formats and communication styles consistently across all interactions.',
    howItWorks: [
      'Start with a pre-trained base model (Llama 3, Mistral, Gemma) or an instruction-tuned variant. Fine-tuning inherits all capabilities of the base model — you are adjusting weights, not replacing the model.',
      'Prepare a dataset of (instruction, response) pairs representing the exact behaviour you want. Data quality dominates quantity — 1,000 curated, high-quality examples routinely outperform 100,000 noisy ones scraped from the web.',
      'Full fine-tuning updates every weight in the model — maximally flexible but requires multi-GPU clusters for 7B+ models and risks catastrophic forgetting, where the model loses general capabilities while over-specializing.',
      'LoRA (Low-Rank Adaptation): inject small trainable rank-r matrices alongside the frozen original weights. Only ~0.1–1% of parameters are trained, stored as a separate adapter that can be loaded on top of any compatible base model and swapped without reloading the base.',
      'QLoRA combines 4-bit quantization with LoRA: the base model loads in reduced precision (cutting GPU memory 4×), while the LoRA adapters train in full precision. A 70B model fine-tuned on a single A100 80GB GPU is practical with QLoRA.',
      'Evaluate improvement on a held-out task-specific test set while monitoring regression on general benchmarks (MMLU, HellaSwag). If general performance degrades, reduce training epochs or add general-domain data to the fine-tuning mix.',
    ],
    keyPoints: [
      'Fine-tune for style and format consistency (always respond in JSON, adopt a specific persona, follow a strict output structure) — RAG is better for injecting fresh or proprietary factual knowledge that changes over time',
      'LoRA/QLoRA is the practical default: 10–100× fewer trainable parameters than full fine-tuning, runs on a single GPU, produces versioned adapters that can be swapped per request',
      'Catastrophic forgetting is a real risk — always evaluate on general benchmarks after fine-tuning to ensure capabilities you rely on have not degraded',
      'RLHF (Reinforcement Learning from Human Feedback) is the technique that turned base LLMs into ChatGPT-style assistants: human raters compare model outputs, and the model is trained to prefer highly-rated responses using PPO',
    ],
    interviewAngles: [
      'When would you fine-tune a model rather than using RAG or prompt engineering?',
      'What is LoRA and how does it reduce the cost and memory footprint of fine-tuning?',
      'What is catastrophic forgetting and how do you detect it after fine-tuning?',
      'What is the difference between instruction fine-tuning and RLHF?',
    ],
  },
  {
    id:       'guardrails',
    category: 'workflows',
    title:    'Hallucinations & Guardrails',
    color:    'rose',
    tagline:  'Why LLMs confabulate and how to build reliable, safe applications',
    description:
      'LLMs hallucinate — they generate plausible-sounding but factually incorrect statements — because they are trained to produce likely token continuations, not to verify truth. Guardrails are the engineering controls (prompt-level and architectural) that constrain model behaviour, validate outputs, and catch harmful or unreliable responses before they reach users.',
    howItWorks: [
      'Why hallucinations occur: the model predicts the next token based on pattern similarity to training data. For rare or out-of-distribution facts, it generates a plausible-sounding continuation even when no correct answer exists in its training distribution — it has no mechanism to say "I don\'t know" without explicit training for that.',
      'RAG as a grounding strategy: providing retrieved documents reduces hallucination by giving the model explicit facts to cite rather than relying on memorized training data. The model can still misread or extend beyond what the documents say, but the rate drops measurably.',
      'Input guardrails: validate user input before it reaches the model. Detect prompt injection ("ignore your previous instructions and..."), jailbreak patterns, PII in inputs that should not be sent to external APIs, and off-topic requests that should be refused at the application layer.',
      'Output guardrails: validate model output before returning it to users. Check for: format validity (is the JSON parseable?), content policy violations (toxicity classifiers), factual claims contradicting source documents, and sensitive data that should not appear in responses.',
      'Self-consistency checking: generate the same response multiple times (with temperature > 0) and compare answers. Divergent answers to the same factual question signal low confidence — surface uncertainty to users rather than presenting one potentially wrong answer with false confidence.',
      'Uncertainty acknowledgement: prompt the model to say "I\'m not certain" or "the documents don\'t address this" when confidence is low. Citation-backed answers — requiring the model to quote source passages — let users verify claims themselves rather than trusting the model blindly.',
    ],
    keyPoints: [
      'Hallucination is a fundamental property of current LLMs, not a fixable bug — design applications assuming some percentage of outputs will be wrong and build validation layers accordingly',
      'Prompt injection is the LLM equivalent of SQL injection — user input can override your system prompt if the model treats it as instructions rather than data. Never render untrusted user input in privileged positions',
      'Content moderation layers (OpenAI Moderation API, Perspective API, custom classifiers) should wrap both input and output in any user-facing application to catch policy violations before they surface',
      'Showing citations alongside answers shifts verification responsibility appropriately: the model answers, users confirm against sources. This is more honest than presenting AI-generated facts as ground truth',
    ],
    interviewAngles: [
      'Why do LLMs hallucinate? What fundamentally causes this behaviour?',
      'What is prompt injection and how would you defend against it in a customer-facing chatbot?',
      'How would you reduce hallucination in a medical information application?',
      'What are the layers of a production guardrail system for a user-facing LLM product?',
    ],
  },

  // ── AI Agents ─────────────────────────────────────────────────────────────────
  {
    id:       'ai-agents',
    category: 'agents',
    title:    'AI Agents',
    color:    'blue',
    tagline:  'LLMs that plan, use tools, and act in a loop to complete tasks',
    description:
      'An AI agent is an LLM operating in an action-observation loop: it receives a goal, decides on a sequence of actions (tool calls, searches, code execution), observes the results, and iterates until the task is complete. Agents handle complex multi-step tasks that require gathering information, making decisions, and adapting based on what they find — going far beyond single-turn question answering.',
    howItWorks: [
      'The ReAct (Reasoning + Acting) pattern structures the agent loop: the model alternates between Thought (reasoning about what to do next), Action (selecting a tool and its arguments), and Observation (the tool\'s output). This loop repeats until the model emits a final answer or a stopping condition is met.',
      'Tools are the agent\'s interface to the outside world: web search, code execution, database lookup, API calls, file operations. The model picks tools from the available set based on the task — its reasoning is explicit in Thought steps and fully auditable.',
      'Memory types: working memory is the current context window (everything so far); external memory stores past tool outputs, conversation history, and retrieved knowledge in a database and selectively retrieves relevant pieces into the context as needed. Without memory management, long-running agents exhaust the context window.',
      'Planning and decomposition: for complex goals, agents decompose tasks into subtasks ("to answer this research question I need to: 1. search for papers, 2. read relevant ones, 3. synthesize findings"). Hierarchical planning assigns subtasks to specialized sub-agents.',
      'Error recovery: agents must handle tool failures gracefully — retrying with different arguments, selecting alternative tools, or concluding they cannot complete the task rather than looping indefinitely. Without explicit error handling, agents get stuck in infinite loops burning tokens and money.',
      'Frameworks: LangChain, LlamaIndex, and Anthropic\'s Claude Agent SDK provide pre-built agent loops, tool integrations, and memory management — handling the plumbing of parsing model output, executing tools, and maintaining conversation history across turns.',
    ],
    keyPoints: [
      'Agents are powerful for tasks requiring dynamic information gathering but dangerous without guardrails — a poorly constrained agent can take costly, irreversible real-world actions (sending emails, making purchases, modifying databases)',
      'The ReAct loop is the foundational agent pattern — every major agent framework implements a variation of Thought/Action/Observation',
      'Context window management is the primary engineering challenge in long-running agents: summarize completed sub-tasks, retrieve relevant memory selectively, prune stale observations',
      'Human-in-the-loop checkpoints are essential for high-stakes actions — the agent proposes, a human confirms, then execution proceeds. Never let agents take irreversible actions autonomously without explicit approval',
    ],
    interviewAngles: [
      'Describe the ReAct pattern. What is a Thought, an Action, and an Observation?',
      'How would you prevent an agent from running in an infinite loop?',
      'What is the difference between an AI agent and a RAG pipeline?',
      'When would you use an agent versus a standard LLM call with function calling?',
    ],
  },
  {
    id:       'multi-agent-systems',
    category: 'agents',
    title:    'Multi-Agent Systems',
    color:    'amber',
    tagline:  'Orchestrate networks of specialized agents to tackle complex tasks',
    description:
      'Multi-agent systems decompose complex workflows across multiple AI agents, each specializing in a subtask. An orchestrator routes tasks to sub-agents (researcher, coder, reviewer), collects their outputs, and synthesizes a final result. This architecture enables parallelism, specialization, and fault isolation — at the cost of coordination complexity and harder debugging.',
    howItWorks: [
      'Orchestrator-subagent pattern: a root orchestrator receives the top-level goal, decomposes it into subtasks, and delegates each to a specialized subagent. The orchestrator synthesizes subagent outputs into a final result. Subagents can be simple LLM calls with focused prompts or full agents with their own tool access.',
      'Parallel execution: independent subtasks run simultaneously. A research agent searches the web while a data agent queries a database; the orchestrator waits for both and merges results. Properly parallelized multi-agent pipelines are significantly faster than sequential single-agent runs for the same task.',
      'Specialization and cost optimization: different agents can use different models appropriate to their task — a large, expensive model for high-stakes reasoning; a smaller, cheaper model for simple extraction or formatting. This optimizes cost while maintaining quality where it matters.',
      'Agent-to-agent communication: agents share context by passing structured messages, writing to a shared memory store, or using message queues. OpenAI\'s Swarm protocol and Anthropic\'s Agent SDK define how agents hand off control and share state in standardized ways.',
      'Critic pattern: one agent generates a response; a second agent critiques it; a third decides which position is correct. This multi-agent debate reduces hallucination and reasoning errors on complex tasks by treating accuracy as a consensus problem.',
      'Failure propagation: multi-agent systems amplify errors — a wrong output from one agent cascades into all downstream agents. Add explicit output validation at each agent boundary. A single misclassified document early in a pipeline can corrupt every subsequent step.',
    ],
    keyPoints: [
      'Multi-agent systems shine for tasks with clearly decomposable subtasks (research + write + review) where stages can run independently — don\'t add agents for tasks a single well-prompted LLM can handle',
      'Each agent call adds latency and cost — the overhead is only justified when parallelism or specialization provides measurable benefit',
      'Debugging multi-agent systems requires tracing the full execution graph: which agent made which decision, with what context, producing what output. Distributed tracing (as in microservices) is the right mental model',
      'Frameworks: CrewAI, AutoGen, LangGraph, and Anthropic\'s Claude Agent SDK. LangGraph expresses agent flow as a directed graph — powerful for complex conditional workflows with loops, branches, and error recovery paths',
    ],
    interviewAngles: [
      'What is the orchestrator-subagent pattern? When is it better than a single agent?',
      'How do you prevent error propagation in a multi-agent pipeline?',
      'How would you design a multi-agent system to write a technical report on a given topic?',
      'What are the cost and latency implications of multiple specialized agents versus one general agent?',
    ],
  },

  // ── Production & Evaluation ───────────────────────────────────────────────────
  {
    id:       'ai-engineer',
    category: 'production',
    title:    'The AI Engineer',
    color:    'indigo',
    tagline:  'The engineer who builds reliable products on top of foundation models',
    description:
      'The AI Engineer is a software engineer who specialises in building applications, pipelines, and systems that productively consume foundation models — rather than training them. The role has emerged rapidly because deploying LLMs reliably is its own discipline: prompt design, retrieval systems, evaluation frameworks, cost management, and production observability are engineering problems that exist independently of any ML background.',
    howItWorks: [
      'The AI Engineer\'s primary tool is the API — they integrate foundation models (GPT-4, Claude, Gemini) as components in a larger software system. The model is a black-box service with a pricing model, a rate limit, and an SLA; engineering around those constraints is the core job.',
      'Core workflow: define the desired product behaviour → design and version prompts → choose a knowledge strategy (RAG, fine-tuning, or direct context injection) → build an evaluation dataset → ship → monitor, measure, and iterate.',
      'Prompt design and management is a first-class engineering concern. Prompts are versioned in source control, tested against an eval suite, and reviewed in pull requests. A prompt change can degrade downstream quality as silently as a broken dependency.',
      'RAG pipelines are the most common AI Engineer deliverable: chunk and embed a document corpus, build a retrieval layer over a vector database, wire it to an LLM, and expose a reliable question-answering or generation endpoint.',
      'Evaluation is the AI Engineer\'s test suite. They write LLM-as-judge rubrics, curate domain-specific benchmark datasets, and run regression checks on every deployment to detect quality drops before users do.',
      'Production concerns dominate: per-request token cost budgets, latency SLAs (especially time-to-first-token), graceful rate-limit handling, model fallback strategies, and semantic caching. These are infrastructure problems, not ML problems.',
    ],
    keyPoints: [
      'AI Engineer ≠ ML Engineer. The AI Engineer rarely trains models — they build on top of pre-trained ones. Deep ML knowledge helps but is not a prerequisite; strong software engineering and systems thinking are essential',
      'The standard stack: foundation model API + orchestration layer (LangChain, LlamaIndex, or custom code) + retrieval system (vector DB) + evaluation framework + observability tooling',
      'Prompt engineering is the AI Engineer\'s highest-leverage skill — a carefully crafted system prompt with good few-shot examples often closes the quality gap between an expensive frontier model and a much cheaper one',
      'The role demands end-to-end ownership: AI Engineers trace failures across the full pipeline — retrieval quality, context window usage, sampling parameters, output parsing, and downstream business logic — not just the model call itself',
    ],
    interviewAngles: [
      'What is the difference between an AI Engineer, an ML Engineer, and a Data Scientist?',
      'Walk me through how you would build a RAG chatbot from scratch — what are the components and the key decisions at each step?',
      'How would you evaluate and measure the quality of an LLM feature before shipping it to production?',
      'A customer support bot you built sometimes gives wrong answers. How do you diagnose whether the problem is retrieval, context, prompting, or the model itself?',
    ],
  },
  {
    id:       'llm-evaluation',
    category: 'production',
    title:    'LLM Evaluation',
    color:    'emerald',
    tagline:  'How to measure whether your AI application actually works',
    description:
      'Evaluating LLM applications is fundamentally different from traditional software testing — there are no exact right answers, and metrics like accuracy require defining what "correct" means for open-ended generation. A robust eval framework combines automated metrics, LLM-as-judge scoring, human review, and regression testing to give continuous confidence that your application is improving, not regressing.',
    howItWorks: [
      'Benchmark datasets: curate a representative set of (input, expected_output) pairs from your specific domain. Unlike generic benchmarks (MMLU, HumanEval), domain-specific evals catch the failure modes that actually matter for your use case. Aim for 100–500 examples that deliberately cover edge cases.',
      'LLM-as-judge: use a stronger model (GPT-4, Claude Opus) to score responses on dimensions like correctness, helpfulness, conciseness, and citation accuracy. Provide explicit scoring rubrics in the judge prompt. Validated against human ratings, LLM-as-judge achieves 70–85% agreement — scalable and cheap compared to human eval at volume.',
      'RAG-specific metrics (RAGAS framework): Context Recall (did retrieval fetch the relevant chunks?), Context Precision (were fetched chunks actually relevant?), Answer Faithfulness (does the answer stay within retrieved docs?), Answer Relevance (does the answer address the question?). These four metrics pinpoint whether a RAG pipeline fails at retrieval or generation.',
      'Regression testing: track eval scores across every code change. A prompt edit that improves one task may silently degrade another. Treat LLM evals like a CI/CD test suite — alert or block deployments when core metrics drop below a defined threshold.',
      'A/B testing: deploy two prompt versions or model configurations to different user segments and measure downstream outcomes (task completion rate, user satisfaction, support escalation rate). Ground truth from actual user behaviour is more reliable than synthetic benchmarks.',
      'Human eval for calibration: periodically have domain experts rate a sample of model outputs. Use this to calibrate automated metrics — if your LLM judge systematically misrates a class of examples, update its rubric or scoring criteria before trusting it at scale.',
    ],
    keyPoints: [
      '"Vibe testing" (manually checking a few responses) does not scale — build an automated eval suite before shipping to production, not after the first incident',
      'RAGAS is the standard framework for evaluating RAG pipelines — run it on every pipeline change to catch retrieval regressions before they reach users',
      'LLM-as-judge is the practical default for subjective evaluation at scale; always calibrate it against human ratings on a representative sample before treating its scores as ground truth',
      'Eval is a product decision, not just an engineering one: what "correct" means must be defined by the business. Make the rubric explicit, versioned, and reviewed alongside the code it evaluates',
    ],
    interviewAngles: [
      'How would you evaluate a customer support chatbot? What metrics would you track?',
      'What is RAGAS and what does each of its four metrics measure?',
      'What is LLM-as-judge? What are its strengths and failure modes?',
      'How do you prevent prompt or model changes from silently regressing quality in production?',
    ],
  },
  {
    id:       'ai-observability',
    category: 'production',
    title:    'AI Observability',
    color:    'sky',
    tagline:  'Monitor, trace, and optimize LLM applications in production',
    description:
      'AI observability extends traditional application monitoring to the unique challenges of LLM systems: non-deterministic outputs, high per-request cost, and quality that drifts as usage patterns change. It combines prompt/response logging, distributed tracing of multi-step LLM calls, cost tracking, latency profiling, and quality monitoring to give engineers visibility into what the model is actually doing — and costing — in production.',
    howItWorks: [
      'Prompt and response logging: every LLM call should log the exact prompt (system prompt + full conversation history), model response, latency, token counts (input + output), cost estimate, model version, and a request ID. This is the foundation for debugging, auditing, and quality review.',
      'Distributed tracing for LLM calls: for multi-step applications (RAG, agents), trace the full request path — which retrieval was triggered, what was fetched, what the model received, what it returned, and how long each step took. LLM-specific tools (LangSmith, Langfuse, Helicone, Phoenix) visualize this as a call tree, unlike generic APM tools that only see HTTP calls.',
      'Cost monitoring: track input and output token counts per request, per user, per feature, and per model version. Token costs vary widely — switching from GPT-4 to GPT-4o-mini may reduce cost 10× with acceptable quality loss. Set budget alerts and per-user quotas to prevent runaway costs from retry storms or long context abuse.',
      'Latency profiling: decompose total latency into components — retrieval time (vector DB query), LLM time-to-first-token (TTFT), LLM generation time, and postprocessing. TTFT is the latency users feel most acutely. Streaming responses (server-sent events) starts displaying output before generation completes, dramatically improving perceived responsiveness.',
      'Quality drift detection: compare rolling averages of eval scores (LLM-as-judge ratings, user feedback signals, task completion rates) over time. Drift occurs due to model updates (providers sometimes silently update the underlying model), prompt changes, or shifting user query distributions. Alert when quality drops below threshold.',
      'Semantic caching: cache model responses for semantically similar queries using embedding similarity (not exact string match). On a cache hit, return the stored response instantly at zero model cost. Most effective for high-traffic FAQ bots and documentation assistants where users repeatedly ask variations of the same questions.',
    ],
    keyPoints: [
      'Token-level cost tracking is non-negotiable at scale — LLM costs are usage-based and can spike unexpectedly from long contexts, retry storms, or a single misconfigured endpoint',
      'Streaming responses (server-sent events) dramatically improve perceived latency — users see the first token in under a second even when full generation takes 10 seconds. Implement streaming from day one; retrofitting it into a non-streaming architecture is painful',
      'Semantic caching can reduce LLM API costs by 30–60% for FAQ-style applications — use cosine similarity on query embeddings with a high threshold (0.95+) to avoid cache collisions on semantically similar but meaningfully different questions',
      'LLM observability tools (LangSmith, Langfuse, Helicone) are purpose-built for the prompt/response/trace model — generic APM tools miss LLM-specific dimensions like token budgets, prompt template versions, and retrieval quality',
    ],
    interviewAngles: [
      'What would you monitor in a production RAG chatbot? What metrics matter most?',
      'How would you track and control the cost of an LLM application at scale?',
      'What is semantic caching and how does it differ from traditional HTTP response caching?',
      'How do you detect quality drift in a deployed LLM application?',
    ],
  },
]
