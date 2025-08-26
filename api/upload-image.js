import { Octokit } from '@octokit/rest';

export default async function handler(req, res) {
  // Only allow POST requests for image uploads
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔍 IMAGE UPLOAD: Upload request received');
  
  try {
    const { image, filename, productId } = req.body;
    
    if (!image || !filename) {
      return res.status(400).json({ error: 'Image data and filename are required' });
    }

    // Get GitHub token from environment or request headers
    const githubToken = process.env.GITHUB_TOKEN || req.headers.authorization?.replace('Bearer ', '');
    
    if (!githubToken) {
      console.error('❌ IMAGE UPLOAD: No GitHub token available');
      return res.status(401).json({ error: 'GitHub authentication required' });
    }

    const octokit = new Octokit({
      auth: githubToken
    });

    // Repository details
    const owner = process.env.GITHUB_OWNER || 'Aashisho1o1';
    const repo = process.env.GITHUB_REPO || 'Jewelry_Online';
    const branch = 'main';

    // Ensure filename is safe and in correct directory
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const imagePath = `public/images/jewelry/${safeFilename}`;

    console.log('🔍 IMAGE UPLOAD: Uploading to path:', imagePath);

    // Convert base64 image to buffer if needed
    let imageContent;
    if (image.startsWith('data:')) {
      // Remove data URL prefix
      const base64Data = image.split(',')[1];
      imageContent = base64Data;
    } else {
      imageContent = image;
    }

    try {
      // Check if file already exists
      let sha = null;
      try {
        const existingFile = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: imagePath,
          ref: branch
        });
        sha = existingFile.data.sha;
        console.log('🔍 IMAGE UPLOAD: File exists, will update with SHA:', sha);
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        console.log('🔍 IMAGE UPLOAD: New file, no existing SHA');
      }

      // Upload/update file to GitHub
      const result = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: imagePath,
        message: `Upload image: ${safeFilename}${productId ? ` for product ${productId}` : ''}`,
        content: imageContent,
        branch,
        ...(sha && { sha }) // Include SHA only if file exists
      });

      console.log('✅ IMAGE UPLOAD: Successfully uploaded to GitHub');

      // Return the public URL
      const publicUrl = `/images/jewelry/${safeFilename}`;
      
      return res.status(200).json({
        success: true,
        url: publicUrl,
        githubUrl: result.data.content.html_url,
        filename: safeFilename,
        path: imagePath
      });

    } catch (githubError) {
      console.error('❌ IMAGE UPLOAD: GitHub API error:', githubError.message);
      return res.status(500).json({ 
        error: 'Failed to upload to GitHub',
        message: githubError.message 
      });
    }

  } catch (error) {
    console.error('❌ IMAGE UPLOAD: General error:', error);
    return res.status(500).json({ 
      error: 'Image upload failed',
      message: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase limit for image uploads
    },
  },
};
