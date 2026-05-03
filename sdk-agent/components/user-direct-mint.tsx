'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, CheckCircle2, ExternalLink, Wallet } from 'lucide-react'
import { ARC_OFFICIAL_CONTRACT, ARC_OFFICIAL_ABI, type AgentMetadata } from '@/lib/contracts'

export function UserDirectMint() {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const MAX_BYTES = 524288 // 0.5 MB
      if (file.size > MAX_BYTES) {
        alert('File size must be less than 0.5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleMint = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first')
      return
    }

    if (!agentName || !agentDescription) {
      alert('Please fill in all required fields')
      return
    }

    setIsUploading(true)
    try {
      // Step 1: Upload avatar to IPFS if provided
      let avatarUrl = ''
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload avatar')
        }

        const uploadData = await uploadResponse.json()
        console.log('[UserDirectMint] avatar upload response:', uploadData)
        avatarUrl = uploadData.ipfsUrl
      }

      // Step 2: Create metadata
      const metadata: AgentMetadata = {
        name: agentName,
        description: agentDescription,
        image: avatarUrl,
        createdAt: new Date().toISOString(),
        attributes: [
          { trait_type: 'Type', value: 'AI Agent' },
          { trait_type: 'Platform', value: 'Arc Testnet' },
          { trait_type: 'Method', value: 'User Direct Mint' },
        ],
      }

      // Step 3: Upload metadata to IPFS
      const metadataResponse = await fetch('/api/upload-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      })

      if (!metadataResponse.ok) {
        throw new Error('Failed to upload metadata')
      }

      const metadataData = await metadataResponse.json()
      console.log('[UserDirectMint] metadata upload response:', metadataData)
      const tokenURI = metadataData.ipfsUrl
      console.log('[UserDirectMint] tokenURI:', tokenURI)

      // Step 4: User signs transaction to mint
      try {
        console.log('[UserDirectMint] calling writeContract', {
          address: ARC_OFFICIAL_CONTRACT,
          functionName: 'register',
          args: [tokenURI],
        })

        const maybePromise = writeContract({
          address: ARC_OFFICIAL_CONTRACT,
          abi: ARC_OFFICIAL_ABI,
          functionName: 'register',
          args: [tokenURI],
        })

        console.log('[UserDirectMint] writeContract returned:', maybePromise)
        if (maybePromise && typeof (maybePromise as any).then === 'function') {
          ;(maybePromise as Promise<any>)
            .then((r) => console.log('[UserDirectMint] writeContract resolved:', r))
            .catch((e) => console.error('[UserDirectMint] writeContract rejected:', e))
        }
      } catch (e) {
        console.error('[UserDirectMint] writeContract thrown error:', e)
        throw e
      }
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to prepare mint')
    } finally {
      setIsUploading(false)
    }
  }

  const isProcessing = isUploading || isPending || isConfirming

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardDescription>
          Agent Identity will be minted to <strong>{address ? address : 'your wallet'}</strong>. You
          pay gas (USDC) and own the agent identity.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Agent Name */}
        <div className='space-y-2'>
          <Label htmlFor='name'>Agent Name *</Label>
          <Input
            id='name'
            placeholder='e.g., Trading Bot Alpha'
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            disabled={isProcessing}
          />
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <Label htmlFor='description'>Description *</Label>
          <Textarea
            id='description'
            placeholder='Describe what your AI agent does...'
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            disabled={isProcessing}
            rows={4}
          />
        </div>

        {/* Avatar Upload */}
        <div className='space-y-2'>
          <Label>Agent Avatar (Optional)</Label>
          {!avatarPreview ? (
            <div className='flex items-center justify-center w-full'>
              <label
                htmlFor='avatar-upload'
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isProcessing
                    ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed'
                    : 'border-slate-600 hover:border-indigo-400 bg-slate-900/30 hover:bg-slate-900/50'
                }`}
              >
                <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                  <Upload className='w-8 h-8 mb-2 text-slate-400' />
                  <p className='text-sm text-slate-400'>
                    <span className='font-semibold'>Click to upload</span> or drag and drop
                  </p>
                  <p className='text-xs text-slate-500'>PNG, JPG or GIF (MAX.0.5MB)</p>
                </div>
                <input
                  id='avatar-upload'
                  type='file'
                  className='hidden'
                  accept='image/*'
                  onChange={handleAvatarChange}
                  disabled={isProcessing}
                />
              </label>
            </div>
          ) : (
            <div className='relative w-full h-48 rounded-lg overflow-hidden border border-slate-700'>
              <img
                src={avatarPreview}
                alt='Avatar preview'
                className='w-full h-full object-cover'
              />
              {!isProcessing && (
                <button
                  onClick={removeAvatar}
                  className='absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors'
                >
                  <X className='w-4 h-4 text-white' />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        {!isConnected ? (
          <div className='p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center'>
            <p className='text-yellow-300 text-sm'>Please connect your wallet to continue</p>
          </div>
        ) : (
          <Button
            onClick={handleMint}
            disabled={!agentName || !agentDescription || isProcessing}
            className='w-full'
            size='lg'
          >
            {isUploading && (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Uploading to IPFS...
              </>
            )}
            {isPending && (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Waiting for signature...
              </>
            )}
            {isConfirming && (
              <>
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
                Confirming transaction...
              </>
            )}
            {!isProcessing && <>Register Agent Identity</>}
          </Button>
        )}

        {/* Success Message */}
        {isSuccess && hash && (
          <div className='p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-2'>
            <div className='flex items-center gap-2 text-green-400'>
              <CheckCircle2 className='h-5 w-5' />
              <span className='font-medium'>Agent identity registered successfully!</span>
            </div>
            <p className='text-sm text-slate-300'>
              Agent Identity NFT is now in your wallet:{' '}
              <strong className='text-green-400'>{address}</strong>
            </p>
            <Button variant='outline' size='sm' asChild className='w-full'>
              <a
                href={`https://testnet.arcscan.app/tx/${hash}`}
                target='_blank'
                rel='noopener noreferrer'
              >
                View on Arcscan
                <ExternalLink className='ml-2 h-4 w-4' />
              </a>
            </Button>
          </div>
        )}

        {/* Info Box */}
        <div className='p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg'>
          <p className='text-sm text-blue-300'>
            💡 <strong>Your Ownership:</strong> Agent Identity NFT will be stored in your personal
            wallet, giving you full control and ownership.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
