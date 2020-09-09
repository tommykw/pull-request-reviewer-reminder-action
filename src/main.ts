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
      // core.info(`pr review comments ${pr.review_comments_url}`)
      // core.info(`pr ids : ${pr.id}`)
      // core.info(`pr created : ${pr.created_at}`)

      core.info(`pr comments ${prInfo.review_comments}`)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
