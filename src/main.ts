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

    const titles = pullRequests.map(pr => {
      pr.title
    })

    core.info(`pr comment review : ${reviewCommentUrls[0]}`)
    core.info(`pr comment : ${commentUrls[0]}`)
    core.info(`pr created : ${createdList[0]}`)
    core.info(`pr title : ${titles}`)
    // eslint-disable-next-line no-empty
  } catch (error) {}
}

run()
