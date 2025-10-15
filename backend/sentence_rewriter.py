# sentence_rewriter.py (No sentencepiece)

from typing import Optional, Tuple

try:
    from transformers import BartTokenizer, BartForConditionalGeneration
except Exception:
    BartTokenizer = None  # type: ignore
    BartForConditionalGeneration = None  # type: ignore

_MODEL_NAME = "facebook/bart-large-cnn"
_tokenizer: Optional["BartTokenizer"] = None
_model: Optional["BartForConditionalGeneration"] = None

def _ensure_model_loaded() -> Tuple[Optional["BartTokenizer"], Optional["BartForConditionalGeneration"]]:
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        if BartTokenizer is None or BartForConditionalGeneration is None:
            return None, None
        try:
            _tokenizer = BartTokenizer.from_pretrained(_MODEL_NAME)
            _model = BartForConditionalGeneration.from_pretrained(_MODEL_NAME)
        except Exception:
            _tokenizer, _model = None, None
    return _tokenizer, _model

def rewrite_sentences(text):
    tok, mdl = _ensure_model_loaded()
    if tok is None or mdl is None:
        return {"rewritten_text": text}

    prompt = f"Rewrite this professionally:\n{text}"
    inputs = tok(prompt, return_tensors="pt", max_length=1024, truncation=True)
    summary_ids = mdl.generate(
        inputs["input_ids"],
        num_beams=4,
        max_length=512,
        early_stopping=True
    )
    output = tok.decode(summary_ids[0], skip_special_tokens=True)
    return {"rewritten_text": output}
