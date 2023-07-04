use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, Mint, MintTo, Token, TokenAccount};

declare_id!("GPbJzd35DJy3wxDnyzy3kdy4qFbNeBxhTMbs2erYkjJL");

#[program]
pub mod contract {

    use super::*;

    pub fn create_organization(ctx: Context<Organization>) -> Result<()> {
        let org = &mut ctx.accounts.org;
        // org.mint = ctx.accounts.mint.key();
        // org.authority = ctx.accounts.authority.as_ref().key();
        org.bump = *ctx.bumps.get("org").unwrap();
        // let cpi_program = ctx.accounts.puppet_program.to_account_info();
        // let cpi_accounts = SetData {
        //     puppet: ctx.accounts.puppet.to_account_info(),
        // };
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // puppet::cpi::set_data(cpi_ctx, data)
        Ok(())
    }

    pub fn register(ctx: Context<Register>) -> Result<()> {
        msg!("We are here");
        // let bump = *ctx.bumps.get("org").unwrap();
        let org = &mut ctx.accounts.org;
        msg!(&org.bump.to_string());
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: org.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let mint = ctx.accounts.mint.key();
        msg!(&org.key().to_string());
        // let authority = ctx.accounts.authority.key;
        let signer: &[&[&[u8]]] = &[&[b"org", mint.as_ref(), ctx.accounts.authority.key.as_ref(), &[org.bump]]];
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        match mint_to(cpi_ctx, 1) {
            Err(err) => {
                msg!(&err.to_string());
                Ok(())
            }
            Ok(_) => Ok(()),
        }
    }

    pub fn submit_rate(ctx: Context<Rating>, score: u8)-> Result<()> {
        let s = &mut ctx.accounts.score;
        let src = &mut ctx.accounts.source;
        let t = s.score.checked_add(score.checked_mul(src.weight).unwrap()).unwrap();
        s.score = t.checked_div(2).unwrap();
        Ok(())
    }

    pub fn make_source(ctx: Context<Sourcing>, source: String, skill: String, weight: u8)-> Result<()> {
        let s = &mut ctx.accounts.source;
        s.source = source;
        s.skill = skill;
        s.weight = weight;
        Ok(())
    }
}

pub trait OrgAccount<'info> {
    fn apply(&self, applicant: &Pubkey) -> Result<()>;
}

impl<'info> OrgAccount<'info> for Account<'info, Org> {
    /// Validates an asset's key is present in the faucet's list of mint
    /// addresses, and throws an error if it is not
    fn apply(&self, applicant: &Pubkey) -> Result<()> {
        Ok(())
    }
}

#[account]
pub struct Score {
    pub score: u8,
    pub owner: Pubkey,
}

#[account]
pub struct Source {
    pub source: String,
    pub skill: String,
    pub weight: u8,
}


#[account]
// #[derive(Default)]
pub struct Org {
    pub bump: u8,
}
#[derive(Accounts)]
pub struct Sourcing<'info> {
    #[account(
        init,
        space = 8 + std::mem::size_of::<Score>(),
        payer = authority
    )]
    pub source: Account<'info, Source>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Rating<'info>{
    #[account()]
    pub applicant: AccountInfo<'info>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account()]
    pub source: Account<'info, Source>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"rating", org.key().as_ref(), applicant.key().as_ref(), source.key().as_ref()],
        bump,
        space= 8 + std::mem::size_of::<Score>()
    )]
    pub score: Account<'info, Score>,
    #[account(
        mut,
        seeds = [b"org", mint.key().as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub org: Account<'info, Org>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

}

#[derive(Accounts)]
pub struct Register<'info> {
    #[account()]
    pub applicant: Signer<'info>,
    #[account()]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"org", mint.key().as_ref(), authority.key().as_ref()],
        bump,
    )]
    pub org: Account<'info, Org>,
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Organization<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 1,
        seeds = [b"org", mint.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub org: Account<'info, Org>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = org,
        mint::freeze_authority = org,
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    ///CHECK: This is not dangerous because we don't read or write from this account
    pub rent: AccountInfo<'info>,
}
