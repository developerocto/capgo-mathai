import { Capacitor } from '@capacitor/core'
import { toast } from 'vue-sonner'
import type { ComposerTranslation } from 'vue-i18n'
import { useSupabase } from './supabase'
import { useDisplayStore } from '~/stores/display'

const displayStore = useDisplayStore()

async function presentActionSheetOpen(url: string) {
  displayStore.actionSheetOption = {
    buttons: [
      {
        text: 'Continue',
        handler: () => {
          window.open(url, '_blank')
        },
      },
    ],
  }
  displayStore.showActionSheet = true
}
export function openBlank(link: string) {
  console.log('openBlank', link)
  if (Capacitor.getPlatform() === 'ios')
    presentActionSheetOpen(link)
  else
    window.open(link, '_blank')
}
export async function openPortal(orgId: string, t: ComposerTranslation) {
  let url = ''
  const supabase = useSupabase()
  const session = await supabase.auth.getSession()
  if (!session)
    return

  const prem = supabase.functions.invoke('private/stripe_portal', {
    body: JSON.stringify({ callbackUrl: window.location.href, orgId }),
  }).then(({ data }) => {
    if (data?.url) {
      url = data.url
    }
  })

  displayStore.dialogOption = {
    header: 'Open your portal',
    message: 'Stripe billing portal will be opened in a new tab',
    buttons: [
      {
        text: t('button-cancel'),
        role: 'cancel',
      },
      {
        text: t('button-confirm'),
        id: 'confirm-button',
        handler: async () => {
          await prem
          if (url)
            openBlank(url)
          else
            toast.error('Cannot open your portal')
        },
      },
    ],
  }
  displayStore.showDialog = true
  return displayStore.onDialogDismiss()
}

export async function openCheckout(priceId: string, successUrl: string, cancelUrl: string, isYear: boolean, orgId: string, t: ComposerTranslation) {
//   console.log('openCheckout')
  const supabase = useSupabase()
  const session = await supabase.auth.getSession()
  if (!session)
    return
  try {
    const resp = await supabase.functions.invoke('private/stripe_checkout', {
      body: JSON.stringify({
        priceId,
        successUrl,
        cancelUrl,
        reccurence: isYear ? 'year' : 'month',
        orgId,
      }),
    })
    if (!resp.error && resp.data && resp.data.url)
      openBlank(resp.data.url)
  }
  catch (error) {
    console.error(error)
    toast.error('Cannot get your checkout')
  }
}
