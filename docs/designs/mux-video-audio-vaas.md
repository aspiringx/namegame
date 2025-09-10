# Mux Video & Audio (VaaS) Pricing Summary

This document summarizes the pricing structure for [Mux](https://mux.com), a
Video-as-a-Service (VaaS) platform. This information is intended to help model
the costs associated with adding video features to the application.

## Core Pricing Components

Mux's pricing model is based on three main actions in the video lifecycle:

### 1. Video In (Encoding)

This is the one-time process of preparing an uploaded video for streaming by
transcoding it into multiple formats and resolutions.

- **Cost**: **Free** for all resolutions.

### 2. Video Stored

This is the recurring monthly cost for storing the video files on Mux's servers.

- **Cost**: Starts at **$0.0024 per minute of video, per month** (based on 720p
  resolution).
- **Audio-only**: $0.00024 per minute, per month.

### 3. Video Out (Streaming/Delivery)

This is the usage-based cost incurred when users watch the videos.

- **Cost**:
  - First **100,000 minutes per month are free**.
  - After the free tier, the cost is **$0.0008 per minute watched** (based on
    720p delivery).
- **Audio-only**: $0.00008 per minute.

---

## Example Cost Scenario

To illustrate the cost, consider a single **10-minute video** that is **watched
500 times** in one month.

- **Encoding Cost**: `$0`
- **Storage Cost**: `10 minutes * $0.0024/min/month` = **`$0.024`** for the
  month.
- **Streaming Cost**: `10 minutes/video * 500 views = 5,000 minutes`. Since this
  is within the 100,000 free minutes, the cost is **`$0`**.

**Total cost for this scenario: $0.024**

If total platform streaming exceeded the free tier, the cost for those 5,000
minutes would be `5,000 * $0.0008 = $4.00`.

---

## Potential Pricing Models for Our App

Based on Mux's structure, we could implement one of the following models:

1.  **Subscription Model**: Offer tiers (e.g., a "Pro Plan") that include a set
    number of video uploads and a generous pool of streaming minutes per month.
    This is simple for users.
2.  **Pay-as-you-go**: Directly charge users based on the two main cost drivers:
    a small monthly fee per minute of video stored, and a fee for every minute
    their content is streamed.
3.  **Hybrid Model**: A base subscription fee that includes a certain amount of
    storage/streaming, with overage charges for exceeding the limits.
