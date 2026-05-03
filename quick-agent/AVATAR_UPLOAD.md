# Avatar Upload Feature - Quick Test Guide

## ✨ What's New?

Agent creation now supports **avatar upload** with automatic IPFS storage via Pinata.

---

## 🎨 Features Added

### 1. **Avatar Upload UI**

- Drag & drop / Click to upload
- Image preview (80x80px rounded)
- File size limit: 5MB
- Supported formats: PNG, JPG, GIF
- Remove button with smooth transition

### 2. **IPFS Storage**

- Avatar uploaded to Pinata IPFS
- Metadata JSON with avatar URL stored on IPFS
- Returns IPFS hash and gateway URL

### 3. **Upload Flow**

```
User selects image
   ↓
Preview displayed
   ↓
Click "Deploy Agent"
   ↓
1. Upload avatar to IPFS (if selected)
2. Create metadata JSON with avatar URL
3. Upload metadata to IPFS
4. Deploy agent on-chain with metadata URL
   ↓
Success modal with transaction link
```

---

## 🧪 How to Test

### Step 1: Configure Pinata (Required)

Add your Pinata API keys to `.env.local`:

```bash
NEXT_PUBLIC_PINATA_API_KEY=your_api_key_here
PINATA_SECRET_KEY=your_secret_key_here
```

Get keys from: https://pinata.cloud/

### Step 2: Start Dev Server

```bash
pnpm dev
```

### Step 3: Test Upload

1. Go to http://localhost:3000
2. Connect your wallet
3. Fill in Agent Name and Description
4. **Click the upload box** or drag an image file
5. You should see:
   - ✅ Image preview
   - ✅ File name and size
   - ✅ Remove button (X)
6. Click "Deploy Agent"
7. Check browser console for:
   ```
   Avatar uploaded to IPFS: ipfs://Qm...
   Agent metadata: {name, description, image, createdAt}
   ```

### Step 4: Verify Upload

After deployment:

- Success modal appears
- Transaction hash displayed
- Avatar IPFS URL logged in console
- You can verify on Pinata dashboard: https://app.pinata.cloud/pinmanager

---

## 📂 New Files Created

```
app/
├── api/
│   ├── upload/
│   │   └── route.ts          # Upload avatar to IPFS
│   └── upload-metadata/
│       └── route.ts          # Upload metadata JSON to IPFS
└── page.tsx                  # Updated with avatar upload UI
```

---

## 🔧 Technical Details

### Avatar Upload API (`/api/upload`)

- **Method:** POST
- **Body:** FormData with 'file' field
- **Returns:**
  ```json
  {
    "success": true,
    "ipfsHash": "Qm...",
    "ipfsUrl": "ipfs://Qm...",
    "gatewayUrl": "https://gateway.pinata.cloud/ipfs/Qm..."
  }
  ```

### Metadata Upload API (`/api/upload-metadata`)

- **Method:** POST
- **Body:** JSON metadata object
  ```json
  {
    "name": "Trading Bot Alpha",
    "description": "AI agent for trading",
    "image": "ipfs://Qm...",
    "createdAt": "2026-04-28T..."
  }
  ```
- **Returns:** Same structure as avatar upload

---

## ⚠️ Important Notes

1. **Pinata API Keys Required**
   - Without keys, upload will fail with error message
   - Free tier: 1GB storage, sufficient for testing

2. **File Size Limit**
   - Client-side: 5MB max
   - Server validates again

3. **Image Preview**
   - Uses FileReader API for instant preview
   - No upload until "Deploy Agent" clicked

4. **Error Handling**
   - File too large → Alert
   - Invalid file type → Alert
   - Upload failure → Exception caught, modal shown

---

## 🚀 Next Steps

1. **Smart Contract Integration**
   - Currently using mock transaction
   - Need to deploy `SimpleAgentRegistry.sol`
   - Update contract address in `.env.local`
   - Integrate with wagmi `useWriteContract`

2. **Enhanced Features** (Optional)
   - Image cropping/resizing before upload
   - Multiple image upload (gallery)
   - Avatar templates/presets
   - NFT avatar integration

3. **Testing Checklist**
   - [ ] Upload PNG image (< 5MB)
   - [ ] Upload JPG image (< 5MB)
   - [ ] Try uploading > 5MB (should reject)
   - [ ] Try uploading non-image file (should reject)
   - [ ] Remove uploaded image
   - [ ] Deploy without avatar (should work)
   - [ ] Deploy with avatar (should work)
   - [ ] Check console logs for IPFS URLs
   - [ ] Verify on Pinata dashboard

---

## 🐛 Troubleshooting

### Issue: "Pinata API keys not configured"

**Solution:** Add keys to `.env.local` and restart dev server

### Issue: Upload fails with 401 Unauthorized

**Solution:** Check if API keys are correct on Pinata dashboard

### Issue: Image doesn't preview

**Solution:** Check browser console for errors, ensure file is valid image format

### Issue: "Failed to upload to IPFS"

**Solution:**

- Check internet connection
- Verify Pinata API keys
- Check Pinata service status: https://status.pinata.cloud/

---

## 📞 Support

- **Pinata Docs:** https://docs.pinata.cloud/
- **IPFS Docs:** https://docs.ipfs.tech/
- **Arc Network:** https://docs.arc.network

---

**Happy Testing! 🎉**
