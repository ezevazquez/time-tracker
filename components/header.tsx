import Link from 'next/link'
import { MainNav } from '@/components/main-nav'
import { AccountDropdown } from '@/components/account-dropdown'
import { ReportModal } from '@/components/report-modal'

export const Header = () => {
    return ( 
        <header className="bg-white dark:bg-zinc-900 shadow-sm sticky top-0 z-30">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-semibold text-primary tracking-tight">
                    <Link href="/">MAES</Link>
                    </h1>
                    <div className="h-6 w-px bg-border mx-4 hidden sm:block" />
                    <MainNav />
                </div>
                <div className="flex items-center space-x-4 ml-auto">
                    <ReportModal />
                    <AccountDropdown />
                </div>
                </div>
            </div>
        </header>
    )
}