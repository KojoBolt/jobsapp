export async function uploadToCloudinary(
  file: File,
  cloudName: string,
  uploadPreset: string
): Promise<{
  url: string;
  publicId: string;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'resumes');

  console.log('Cloudinary upload config:', {
    cloudName,
    uploadPreset,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;
  console.log('Upload URL:', uploadUrl);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cloudinary error response:', errorText);
    
    let errorMessage = 'Unknown error';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || JSON.stringify(errorData);
    } catch {
      errorMessage = errorText;
    }
    
    throw new Error(`Cloudinary upload failed: ${errorMessage}`);
  }

  const data = await response.json();
  console.log('Upload successful:', data);
  
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}