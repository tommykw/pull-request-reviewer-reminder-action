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

    const reviewCommentUrls = pullRequests.map(pr => {
      pr.review_comments_url
    })

    const commentUrls = pullRequests.map(pr => {
      pr.comments_url
    })

    const createdList = pullRequests.map(pr => {
      pr.created_at
    })

    core.info(`pr comment review : ${reviewCommentUrls}`)
    core.info(`pr comment : ${commentUrls}`)
    core.info(`pr created : ${createdList}`)
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

run()
