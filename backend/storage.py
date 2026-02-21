import io
import uuid
from datetime import datetime
from config import get_settings

settings = get_settings()

try:
    from azure.storage.blob import BlobServiceClient, ContentSettings
    _client = BlobServiceClient.from_connection_string(settings.AZURE_STORAGE_CONNECTION_STRING)
    AZURE_AVAILABLE = True
except Exception:
    AZURE_AVAILABLE = False
    _client = None


def _get_container():
    return _client.get_container_client(settings.AZURE_CONTAINER_NAME)


async def upload_photo(file_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """Upload photo to Azure Blob and return public URL."""
    if not AZURE_AVAILABLE:
        # Fallback: save locally and return relative path
        import os
        local_dir = "uploads"
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{filename}"

    blob_name = f"persons/{filename}"
    container = _get_container()
    container.upload_blob(
        name=blob_name,
        data=io.BytesIO(file_bytes),
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    account_name = _client.account_name
    return f"https://{account_name}.blob.core.windows.net/{settings.AZURE_CONTAINER_NAME}/{blob_name}"


async def upload_snapshot(file_bytes: bytes, case_id: str) -> str:
    """Upload detection snapshot to Azure Blob."""
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"detections/{case_id}_{ts}_{uuid.uuid4().hex[:8]}.jpg"

    if not AZURE_AVAILABLE:
        import os
        local_dir = "uploads/detections"
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join("uploads", filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)
        return f"/uploads/{filename}"

    container = _get_container()
    container.upload_blob(
        name=filename,
        data=io.BytesIO(file_bytes),
        overwrite=True,
        content_settings=ContentSettings(content_type="image/jpeg"),
    )
    account_name = _client.account_name
    return f"https://{account_name}.blob.core.windows.net/{settings.AZURE_CONTAINER_NAME}/{filename}"


def delete_blob(url: str):
    """Delete a blob by URL."""
    if not AZURE_AVAILABLE or not url.startswith("https://"):
        return
    try:
        blob_name = "/".join(url.split("/")[4:])  # strip account/container
        blob_name = blob_name.replace(f"{settings.AZURE_CONTAINER_NAME}/", "", 1)
        _get_container().delete_blob(blob_name)
    except Exception:
        pass
