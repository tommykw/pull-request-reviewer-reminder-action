import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  const octokit = github.getOctokit(core.getInput('github_token'))

  try {
    const {data: pullRequests} = await octokit.pulls.list({
      ...github.context.repo,
      state: 'open'
    })
    core.info(`pr num1: ${pullRequests.length}`)

    core.info(`pr info: ${pullRequests}`)

    core.error(`test`)

    const reviewCommentUrls = pullRequests.map(pr => {
      pr.review_comments_url
    })

    core.info(`pr comment: ${reviewCommentUrls}`)
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

run()
