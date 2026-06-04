// ── AI Registry ───────────────────────────────────────────────────────────────
// All AI learning topics defined inline.
// Categories: history | ml | llms | workflows

export const AI_CATEGORY_LABELS = {
  history:   'History & Foundations',
  ml:        'Core ML',
  llms:      'LLMs & Transformers',
  workflows: 'AI Workflows',
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
]
