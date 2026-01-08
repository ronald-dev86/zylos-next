// API endpoint to fix duplicate user records
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 })
    }

    const supabase = createServiceClient()

    // First, check for duplicates
    const { data: duplicates, error: duplicateError } = await supabase
      .from('users')
      .select('id, email, tenant_id, role, created_at')
      .eq('id', userId)
      .order('created_at', { ascending: false })

    if (duplicateError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to check for duplicates',
        error: duplicateError.message
      }, { status: 500 })
    }

    if (!duplicates || duplicates.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No duplicates found',
        data: { recordCount: duplicates?.length || 0, user: duplicates?.[0] }
      })
    }

    console.log(`Found ${duplicates.length} duplicates for user ${userId}:`, duplicates)

    // Keep the most recent record, delete the rest
    const recordsToDelete = duplicates.slice(1)
    
    let deletedCount = 0
    for (const record of recordsToDelete) {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', (record as any).id)
        .eq('created_at', (record as any).created_at)

      if (!deleteError) {
        deletedCount++
        console.log(`Deleted duplicate record:`, record)
      } else {
        console.error(`Failed to delete record:`, record, deleteError)
      }
    }

    // Verify the fix
    const { data: finalRecord, error: verifyError } = await supabase
      .from('users')
      .select('id, email, tenant_id, role, created_at')
      .eq('id', userId)
      .single()

    if (verifyError) {
      return NextResponse.json({
        success: false,
        message: 'Verification after cleanup failed',
        error: verifyError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${deletedCount} duplicate records`,
      data: {
        originalCount: duplicates.length,
        deletedCount: deletedCount,
        finalRecord: finalRecord
      }
    })

  } catch (error) {
    console.error('Fix duplicates error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fix duplicates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createServiceClient()

    // Find all duplicate user IDs
    const { data: duplicates, error } = await supabase
      .from('users')
      .select('id, email, tenant_id, role, created_at')
      .order('id, created_at')

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch user records',
        error: error.message
      }, { status: 500 })
    }

    // Group by ID to find duplicates
    const grouped: Record<string, any[]> = {}
    duplicates?.forEach((user: any) => {
      const userId = user.id
      if (!grouped[userId]) {
        grouped[userId] = []
      }
      grouped[userId].push(user)
    })

    const duplicateIds = Object.keys(grouped).filter(id => {
      const group = grouped[id]
      return group && group.length > 1
    })

    return NextResponse.json({
      success: true,
      message: `Found ${duplicateIds.length} users with duplicate records`,
      data: {
        totalUsers: duplicates?.length || 0,
        duplicateUserIds: duplicateIds,
        duplicateDetails: Object.fromEntries(
          duplicateIds.map(id => [id, grouped[id]])
        )
      }
    })

  } catch (error) {
    console.error('Find duplicates error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to find duplicates',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}