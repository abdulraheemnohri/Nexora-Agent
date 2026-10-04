$ErrorActionPreference = "Stop"
$repo = if($env:NEXORA_LITERT_MODEL_REPO){$env:NEXORA_LITERT_MODEL_REPO}else{"litert-community/gemma-4-E2B-it-litert-lm"}
$file = if($env:NEXORA_LITERT_MODEL_FILE){$env:NEXORA_LITERT_MODEL_FILE}else{"gemma-4-E2B-it.litertlm"}
Write-Host "Nexora LiteRT-LM installer"
if(Get-Command uv -ErrorAction SilentlyContinue){ uv tool install --upgrade litert-lm }
elseif(Get-Command py -ErrorAction SilentlyContinue){ py -m pip install --user --upgrade litert-lm }
elseif(Get-Command python -ErrorAction SilentlyContinue){ python -m pip install --user --upgrade litert-lm }
else{ throw "Install uv or Python 3 first." }
if(-not (Get-Command litert-lm -ErrorAction SilentlyContinue)){ throw "LiteRT-LM installed but litert-lm is not on PATH." }
litert-lm --help | Out-Null
Write-Host "LiteRT-LM CLI installed."
Write-Host "Smart Mini: $repo / $file"
Write-Host "Model download happens on first run."
