use anchor_lang::prelude::*;

declare_id!("ErAmA79CeCw8RLQVKQasKSowveXuPfwQSSunm89ZM4fo");

#[program]
pub mod contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let org_key = &mut ctx.accounts.org_key;
        let org = &mut ctx.accounts.org;
        org.key = org_key.as_ref().key();
        org.authority = ctx.accounts.payer.as_ref().key();
        // org.bump = *ctx.bumps.get("org").unwrap();
        // let cpi_program = ctx.accounts.puppet_program.to_account_info();
        // let cpi_accounts = SetData {
        //     puppet: ctx.accounts.puppet.to_account_info(),
        // };
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // puppet::cpi::set_data(cpi_ctx, data)
        Ok(())
    }

    pub fn apply(ctx: Context<Apply>) -> Result<()> {
        msg!("We are here");
        let application = &mut ctx.accounts.application;
        application.applicant = ctx.accounts.applicant.key();
        application.bump = *ctx.bumps.get("application").unwrap();
        application.state = 0;
        Ok(())
    }
}

#[account]
// #[derive(Default)]
pub struct Org {
    key: Pubkey,
    authority: Pubkey,
}

#[account]
// #[derive(Default)]
pub struct Application {
    pub applicant: Pubkey,
    state: u8,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct Apply<'info> {
    #[account(
        init,
        payer = applicant,
        space=8+32+8+1,
        seeds = [b"org-applications", org.key().as_ref(), applicant.key().as_ref()],
        bump
    )]
    pub application: Account<'info, Application>,
    #[account(mut)]
    pub applicant: Signer<'info>,
    #[account()]
    pub org: Account<'info, Org>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: just a reference for key
    #[account()]
    pub org_key: AccountInfo<'info>,
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32,
        // seeds = [b"org", payer.key().as_ref()],
        // bump
    )]
    pub org: Account<'info, Org>,
    pub system_program: Program<'info, System>,
}
