import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type PwaInstallValue = {
  canInstall: boolean
  installed: boolean
  isIos: boolean
  install: () => Promise<boolean>
}

const PwaInstallContext = createContext<PwaInstallValue | null>(null)

export const PwaInstallProvider = ({ children }: PropsWithChildren) => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches,
  )

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as BeforeInstallPromptEvent)
    }
    const markInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', capturePrompt)
    window.addEventListener('appinstalled', markInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt)
      window.removeEventListener('appinstalled', markInstalled)
    }
  }, [])

  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(window.navigator.userAgent), [])

  const value = useMemo<PwaInstallValue>(
    () => ({
      canInstall: Boolean(promptEvent),
      installed,
      isIos,
      install: async () => {
        if (!promptEvent) return false
        await promptEvent.prompt()
        const result = await promptEvent.userChoice
        if (result.outcome === 'accepted') setPromptEvent(null)
        return result.outcome === 'accepted'
      },
    }),
    [installed, isIos, promptEvent],
  )

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>
}

export const usePwaInstall = () => {
  const value = useContext(PwaInstallContext)
  if (!value) throw new Error('usePwaInstall phải nằm trong PwaInstallProvider.')
  return value
}
