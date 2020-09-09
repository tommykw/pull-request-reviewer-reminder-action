import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })

    core.info(`PullRequest count : ${pullRequests.length}`)

    for (const pr of pullRequests) {
      if (pr.draft) {
        continue
      }

      const {data: prInfo} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      core.info(`title ${pr.title} created ${pr.created_at}`)
      core.info(`title ${pr.title} created ${pr.created_at}`)

      if (prInfo.requested_reviewers.length === 0) {
        continue
      }

      if (prInfo.review_comments !== 0) {
        continue
      }

      const reviewers = prInfo.requested_reviewers
        .map(rr => `@${rr.login}`)
        .join(', ')

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {data: result} = await octokit.issues.createComment({
        issue_number: prInfo.number,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        body: `${reviewers} コメントないよ！`
      })
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
