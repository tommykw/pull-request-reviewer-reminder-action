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
      const {data: prInfo} = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: pr.number
      })

      if (prInfo.review_comments === 0) {
        // レビューコメントがなければ、
        core.info(`pr comments ${prInfo.review_comments}`)

        //octokit.pulls.createReviewComment
        prInfo.requested_reviewers.map(r => {
          core.info(`reviewer ${r.login}`)
          core.info(`reviewer type ${r.type}`)
          r.login
        })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {data: result} = await octokit.issues.createComment({
          issue_number: prInfo.number,
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          body: 'コメントないよ！'
        })
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
