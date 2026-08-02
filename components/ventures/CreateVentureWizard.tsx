'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { SECTORS, STAGES, FUNDING_STAGES, REGISTRATION_TYPES, BUSINESS_MODELS } from '@/lib/config/sectors'
import { 
  RocketLaunch, 
  Buildings, 
  Target, 
  MapPin, 
  CalendarBlank,
  Users,
  CaretRight,
  CaretLeft,
  Check,
  Upload,
  Sparkle,
  X,
} from '@phosphor-icons/react'
import { useDropzone } from 'react-dropzone'

const steps = [
  { id: 1, title: 'The Basics', icon: RocketLaunch, description: 'Name, tagline, logo' },
  { id: 2, title: 'Sector & Category', icon: Target, description: 'What industry you operate in' },
  { id: 3, title: 'Stage & Business', icon: Sparkle, description: 'Your stage and business model' },
  { id: 4, title: 'Location & Legal', icon: Buildings, description: 'HQ and registration' },
  { id: 5, title: 'Team & Founding', icon: Users, description: 'When you started, team size' },
  { id: 6, title: 'Review & Launch', icon: Check, description: 'Confirm and create' },
]

export function CreateVentureWizard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [creating, setCreating] = useState(false)
  
  // Form data
  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [customCategory, setCustomCategory] = useState('')
  
  const [stage, setStage] = useState<string>('idea')
  const [fundingStage, setFundingStage] = useState<string>('bootstrapped')
  const [fundingAmount, setFundingAmount] = useState('')
  const [businessModel, setBusinessModel] = useState<string>('')
  const [businessModelSearch, setBusinessModelSearch] = useState('')
  
  const [headquarters, setHeadquarters] = useState('')
  const [website, setWebsite] = useState('')
  const [registrationType, setRegistrationType] = useState<string>('not-registered')
  
  const [foundedDate, setFoundedDate] = useState('')
  const [teamSize, setTeamSize] = useState('1')
  const [isBuildingPublic, setIsBuildingPublic] = useState(true)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDrop: (files) => {
      const file = files[0]
      if (file) {
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
      }
    },
    onDropRejected: () => {
      toast.error('Logo must be under 5MB')
    }
  })

  const selectedSectorData = SECTORS.find(s => s.id === selectedSector)
  const filteredBusinessModels = BUSINESS_MODELS.filter(bm =>
    bm.label.toLowerCase().includes(businessModelSearch.toLowerCase())
  )

  const canProceed = () => {
    switch (currentStep) {
      case 1: return name.trim().length > 0 && tagline.trim().length > 0
      case 2: return selectedSector && (selectedCategory || customCategory)
      case 3: return stage && businessModel
      case 4: return headquarters.trim().length > 0
      case 5: return foundedDate.length > 0
      default: return true
    }
  }

  const uploadLogo = async (ventureId: string): Promise<string | null> => {
    if (!logoFile) return null
    
    const path = `${ventureId}/logo-${Date.now()}.jpg`
    const { error } = await supabase.storage
      .from('ventures')
      .upload(path, logoFile, {
        cacheControl: '3600',
        upsert: true,
      })
    
    if (error) {
      console.error('Logo upload failed:', error)
      return null
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('ventures')
      .getPublicUrl(path)
    
    return publicUrl
  }

  const handleCreate = async () => {
    setCreating(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in')
        return
      }

      // Generate slug
      const slug = name.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 8)

      // Insert venture first (without logo)
      const { data: venture, error } = await supabase
        .from('ventures')
        .insert({
          user_id: user.id,
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim() || null,
          slug,
          sector: selectedSector,
          sub_category: selectedCategory === 'custom' ? customCategory : selectedCategory,
          industry: selectedSectorData?.label,
          stage,
          funding_stage: fundingStage,
          funding_amount: fundingAmount.trim() || null,
          business_model: businessModel,
          headquarters: headquarters.trim(),
          website: website.trim() || null,
          registration_type: registrationType,
          start_date: foundedDate,
          team_size: parseInt(teamSize) || 1,
          is_current: true,
          is_building_public: isBuildingPublic,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Upload logo if provided
      if (logoFile && venture) {
        const logoUrl = await uploadLogo(venture.id)
        if (logoUrl) {
          await supabase
            .from('ventures')
            .update({ logo_url: logoUrl })
            .eq('id', venture.id)
        }
      }

      // Add founder as team member
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

      await supabase.from('venture_team_members').insert({
        venture_id: venture.id,
        user_id: user.id,
        name: profile?.full_name || 'Founder',
        role: 'Founder',
        avatar_url: profile?.avatar_url,
        is_founder: true,
        can_view_notifications: true,
        joined_date: foundedDate,
        position: 0,
      })

      toast.success('Venture created successfully!')
      
      // Redirect to venture page
      router.push(`/ventures/${venture.slug}`)
    } catch (err: any) {
      console.error('Create venture error:', err)
      toast.error('Failed to create venture: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create Your Venture</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build in public. Track progress. Attract the right people.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                      currentStep === step.id
                        ? 'bg-primary text-primary-foreground border-primary scale-110'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-background border-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4" weight="bold" />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div className={cn(
                    'h-0.5 flex-1',
                    currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">{steps[currentStep - 1].title}</h2>
            <p className="text-xs text-muted-foreground">{steps[currentStep - 1].description}</p>
          </div>
        </div>

        {/* Steps Content */}
        <div className="bg-card border rounded-2xl p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {/* STEP 1: Basics */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  {logoPreview ? (
                    <div className="relative w-24 h-24">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full rounded-2xl object-cover border-2 border-primary/30"
                      />
                      <button
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                        }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg"
                      >
                        <X className="w-3 h-3" weight="bold" />
                      </button>
                    </div>
                  ) : (
                    <div
                      {...getRootProps()}
                      className={cn(
                        'w-24 h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                        isDragActive
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-5 h-5 text-muted-foreground" weight="duotone" />
                      <p className="text-[10px] text-muted-foreground mt-1">Upload</p>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Square logo works best. Max 5MB.
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Venture Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. NeuralNova, Zomato, Chai Shop"
                    className="h-11 text-base"
                    autoFocus
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-2">
                  <Label htmlFor="tagline">One-line Description *</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Making AI reasoning transparent, interpretable & reliable."
                    maxLength={120}
                  />
                  <p className="text-[11px] text-muted-foreground text-right">
                    {tagline.length}/120
                  </p>
                </div>

                {/* Short Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Brief Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A quick summary. You can add full details later."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-[11px] text-muted-foreground text-right">
                    {description.length}/500
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Sector & Category */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Sector Selection */}
                {!selectedSector ? (
                  <>
                    <div>
                      <Label className="text-base">Which sector do you operate in?</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose the main industry. DSRT is for every kind of business, not just tech.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto pr-2">
                      {SECTORS.map((sector) => (
                        <button
                          key={sector.id}
                          onClick={() => {
                            setSelectedSector(sector.id)
                            setSelectedCategory('')
                          }}
                          className="p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
                        >
                          <div className={`w-10 h-10 rounded-lg bg-${sector.color}-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                            <span className={`text-${sector.color}-500 font-bold text-sm`}>
                              {sector.label.charAt(0)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold">{sector.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {sector.subCategories.length} categories
                          </p>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">
                          What kind of {selectedSectorData?.label.toLowerCase()} business?
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Select the closest match, or add your own
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedSector('')
                          setSelectedCategory('')
                        }}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Change sector
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                      {selectedSectorData?.subCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id)
                            setCustomCategory('')
                          }}
                          className={cn(
                            'p-3 border rounded-lg text-left transition-all',
                            selectedCategory === cat.id
                              ? 'border-primary bg-primary/10'
                              : 'hover:border-primary/50 hover:bg-muted'
                          )}
                        >
                          <p className="text-sm font-medium">{cat.label}</p>
                          {selectedCategory === cat.id && (
                            <Check className="w-3 h-3 text-primary mt-1" weight="bold" />
                          )}
                        </button>
                      ))}
                      
                      {/* Custom option */}
                      <button
                        onClick={() => {
                          setSelectedCategory('custom')
                        }}
                        className={cn(
                          'p-3 border rounded-lg text-left transition-all border-dashed',
                          selectedCategory === 'custom'
                            ? 'border-primary bg-primary/10'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <p className="text-sm font-medium">+ Custom</p>
                        <p className="text-[10px] text-muted-foreground">Add your own</p>
                      </button>
                    </div>

                    {selectedCategory === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <Label>Enter your custom category</Label>
                        <Input
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g. Handmade Pottery Studio, Wedding Photography..."
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* STEP 3: Stage & Business */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Stage */}
                <div className="space-y-3">
                  <Label className="text-base">What stage are you at?</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {STAGES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setStage(s.id)}
                        className={cn(
                          'p-3 border-2 rounded-lg text-xs font-semibold transition-all',
                          stage === s.id ? s.color + ' scale-105' : 'border-border hover:bg-muted'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funding Stage */}
                <div className="space-y-3">
                  <Label className="text-base">Funding Status</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {FUNDING_STAGES.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFundingStage(f.id)}
                        className={cn(
                          'p-3 border-2 rounded-lg text-xs font-semibold transition-all',
                          fundingStage === f.id 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-border hover:bg-muted'
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {['seed', 'series-a', 'series-b', 'series-c', 'series-d'].includes(fundingStage) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <Label>Total Funding Raised (optional)</Label>
                      <Input
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                        placeholder="e.g. $1.5M, ₹5 Cr, $500K"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Business Model */}
                <div className="space-y-3">
                  <Label className="text-base">Business Model *</Label>
                  <Input
                    value={businessModelSearch}
                    onChange={(e) => setBusinessModelSearch(e.target.value)}
                    placeholder="Search business models..."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-2">
                    {filteredBusinessModels.map((bm) => (
                      <button
                        key={bm.id}
                        onClick={() => setBusinessModel(bm.id)}
                        className={cn(
                          'p-2.5 border rounded-lg text-left text-xs font-medium transition-all',
                          businessModel === bm.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:border-primary/50 hover:bg-muted'
                        )}
                      >
                        {bm.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Location & Legal */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="hq">Headquarters *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" weight="duotone" />
                    <Input
                      id="hq"
                      value={headquarters}
                      onChange={(e) => setHeadquarters(e.target.value)}
                      placeholder="e.g. Bengaluru, India"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (optional)</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-base">Registration Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {REGISTRATION_TYPES.map((rt) => (
                      <button
                        key={rt.id}
                        onClick={() => setRegistrationType(rt.id)}
                        className={cn(
                          'p-2.5 border rounded-lg text-xs font-medium transition-all',
                          registrationType === rt.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:border-primary/50 hover:bg-muted'
                        )}
                      >
                        {rt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Team & Founding */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="founded">Founded Date *</Label>
                  <div className="relative">
                    <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" weight="duotone" />
                    <Input
                      id="founded"
                      type="date"
                      value={foundedDate}
                      onChange={(e) => setFoundedDate(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team">Current Team Size</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" weight="duotone" />
                    <Input
                      id="team"
                      type="number"
                      min="1"
                      value={teamSize}
                      onChange={(e) => setTeamSize(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isBuildingPublic}
                      onChange={(e) => setIsBuildingPublic(e.target.checked)}
                      className="w-4 h-4 mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Build in Public with DSRT Connect</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share your progress, metrics, and updates transparently with the community. 
                        Get feedback, find teammates, and attract investors.
                      </p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Review */}
            {currentStep === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-base">Ready to launch?</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Review your venture details. You can edit everything later.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Header preview */}
                  <div className="flex items-center gap-3 p-4 border rounded-xl bg-muted/20">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg">{name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{tagline}</p>
                    </div>
                  </div>

                  <ReviewRow label="Sector" value={selectedSectorData?.label} />
                  <ReviewRow label="Category" value={
                    selectedCategory === 'custom' 
                      ? customCategory 
                      : selectedSectorData?.subCategories.find(c => c.id === selectedCategory)?.label
                  } />
                  <ReviewRow label="Stage" value={STAGES.find(s => s.id === stage)?.label} />
                  <ReviewRow label="Funding Stage" value={FUNDING_STAGES.find(f => f.id === fundingStage)?.label} />
                  {fundingAmount && <ReviewRow label="Funding Raised" value={fundingAmount} />}
                  <ReviewRow label="Business Model" value={BUSINESS_MODELS.find(bm => bm.id === businessModel)?.label} />
                  <ReviewRow label="Headquarters" value={headquarters} />
                  <ReviewRow label="Registration" value={REGISTRATION_TYPES.find(r => r.id === registrationType)?.label} />
                  <ReviewRow label="Founded" value={foundedDate ? new Date(foundedDate).toLocaleDateString() : ''} />
                  <ReviewRow label="Team Size" value={teamSize + (parseInt(teamSize) === 1 ? ' person' : ' people')} />
                  <ReviewRow label="Building in Public" value={isBuildingPublic ? 'Yes' : 'No'} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || creating}
          >
            <CaretLeft className="w-4 h-4 mr-1" weight="bold" />
            Back
          </Button>

          <p className="text-xs text-muted-foreground">
            Step {currentStep} of {steps.length}
          </p>

          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
            >
              Continue
              <CaretRight className="w-4 h-4 ml-1" weight="bold" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-gradient-to-r from-blue-500 to-purple-500"
            >
              {creating ? (
                <>Creating...</>
              ) : (
                <>
                  <RocketLaunch className="w-4 h-4 mr-1" weight="bold" />
                  Launch Venture
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}