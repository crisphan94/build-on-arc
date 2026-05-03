'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react'
import { type AgentMetadata } from '@/lib/contracts'

export function CircleDeveloperMint() {
  const { address, isConnected } = useAccount()

  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(null)

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

  const handleCreateAgent = async () => {
    if (!agentName || !agentDescription) {
      alert('Please fill in all required fields')
      return
    }

    setIsDeploying(true)
    setTxHash(null)
    setSmartWalletAddress(null)

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
          { trait_type: 'Method', value: 'Circle Developer-Controlled' },
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
      const tokenURI = metadataData.ipfsUrl

      // Step 4: Call Circle SDK to create SCW and mint
      const mintResponse = await fetch('/api/mint-agent-official', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadataURI: tokenURI }),
      })

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json()
        throw new Error(errorData.error || 'Failed to mint agent')
      }

      const mintData = await mintResponse.json()
      setTxHash(mintData.txHash)
      setSmartWalletAddress(mintData.walletAddress)

      // Reset form
      setAgentName('')
      setAgentDescription('')
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to create agent')
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardDescription>
          Register your agent identity via Circle SDK. No gas fees required. Identity stored
          on-chain.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Agent Name */}
        <div className='space-y-2'>
          <Label htmlFor='name-circle'>Agent Name *</Label>
          <Input
            id='name-circle'
            placeholder='e.g., Trading Bot Alpha'
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            disabled={isDeploying}
          />
        </div>

        {/* Description */}
        <div className='space-y-2'>
          <Label htmlFor='description-circle'>Description *</Label>
          <Textarea
            id='description-circle'
            placeholder='Describe what your AI agent does...'
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            disabled={isDeploying}
            rows={4}
          />
        </div>

        {/* Avatar Upload */}
        <div className='space-y-2'>
          <Label>Agent Avatar (Optional)</Label>
          {!avatarPreview ? (
            <div className='flex items-center justify-center w-full'>
              <label
                htmlFor='avatar-upload-circle'
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDeploying
                    ? 'border-slate-700 bg-slate-900/50 cursor-not-allowed'
                    : 'border-slate-600 hover:border-indigo-400 bg-slate-900/30 hover:bg-slate-900/50'
                }`}
              >
                <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                  <Upload className='w-8 h-8 mb-2 text-slate-400' />
                  <p className='text-sm text-slate-400'>
                    <span className='font-semibold'>Click to upload</span> or drag and drop
                  </p>
                  <p className='text-xs text-slate-500'>PNG, JPG or GIF (MAX. 0.5MB)</p>
                </div>
                <input
                  id='avatar-upload-circle'
                  type='file'
                  className='hidden'
                  accept='image/*'
                  onChange={handleAvatarChange}
                  disabled={isDeploying}
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
              {!isDeploying && (
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
        <Button
          onClick={handleCreateAgent}
          disabled={!agentName || !agentDescription || isDeploying}
          className='w-full'
          size='lg'
        >
          {isDeploying ? (
            <>
              <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              Registering Agent...
            </>
          ) : (
            <>Register Agent Identity (Gasless)</>
          )}
        </Button>

        {/* Success Message */}
        {txHash && smartWalletAddress && (
          <div className='p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3'>
            <div className='flex items-center gap-2 text-green-400'>
              <CheckCircle2 className='h-5 w-5' />
              <span className='font-medium'>Agent identity registered successfully!</span>
            </div>
            <div className='space-y-2 text-sm'>
              <p className='text-slate-300'>
                <strong>Smart Contract Wallet:</strong>
              </p>
              <code className='block p-2 bg-slate-900 rounded text-green-400 text-xs break-all'>
                {smartWalletAddress}
              </code>
            </div>
            <Button variant='outline' size='sm' asChild className='w-full'>
              <a
                href={`https://testnet.arcscan.app/tx/${txHash}`}
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
            💡 Agent Identity will be registered via Smart Contract Wallet. The identity is stored
            on-chain
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
